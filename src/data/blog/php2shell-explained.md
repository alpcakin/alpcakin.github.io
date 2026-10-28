---
title: "PHP2Shell, Explained"
description: Everyone saw the headline. Here’s what the PHP bug that pulled sites offline around the world actually did.
pubDatetime: 2026-10-28T14:00:00Z
tags:
  - security
  - php
  - vulnerabilities
  - web
featured: false
draft: false
---

On October 21, 2026, a vulnerability called PHP2Shell was disclosed, and it hit hard: within hours a lot of sites went down or rushed to patch. But what was it really? This was a flaw that had been sitting there unnoticed for years, and most people only ever saw the headline. In this piece we’ll go through it in simple terms, explaining every term as we go, so you can actually picture what the vulnerability was doing. I’ll explain it the way I came to understand it, without assuming you already know the technical details.

## PHP and the blast radius

First, let’s understand what PHP is and the blast radius of this story. PHP is a programming language that runs on the server and builds most of the pages you visit. It was the dominant way to build the web in the 2000s and 2010s, and even though developers have moved to newer tools since, PHP never actually left: roughly 7 in 10 websites whose server-side language is known still run on it. If a site is more than a few years old, there’s a good chance PHP is somewhere underneath it. WordPress, the platform behind a huge share of the web, is built on PHP, and so is Wikipedia’s software. That’s why, within hours of the flaws becoming public, governments and institutions across multiple continents pulled their own sites offline as a precaution: the UK took 32 government services offline, Finland’s state IT provider Valtori shut down public government web services, French prefecture websites went dark, and Berlin’s Charité and five other German university hospitals took their sites down, as did the Wikimedia Foundation with some of its systems.

## Programs, processes and workers

To understand the problem, we have to understand what a program, a process, and a worker are. In very basic terms, a program is your application’s files sitting on disk, doing nothing. A process is a running copy of that program, loaded into RAM. For your CPU to actually execute a program, it has to be loaded into RAM first. Workers follow the same idea. A worker is a process that’s been loaded into RAM in advance and kept there, specifically to handle incoming requests. So when you send a request to a website, it’s not the program itself that handles it, it’s one of these already-running worker processes. There are usually several workers running at once, ready to pick up requests, but each individual worker can only handle one request at a time.

## What happens when you visit a site

Let’s see what happens when someone opens their browser and visits a website. First, the browser sends a request to the website’s server. A worker that’s been sitting in the server’s RAM, waiting, picks up this request and starts processing it. The very first thing it does is unpack the request into a list: every piece of data you sent, like your cookies, or anything you typed into a form, gets organized into a structured list that the rest of the code can actually work with. Once that list exists, the application’s own code runs on top of it: it reads what you sent, maybe talks to a database, and builds the page you are going to see. Different languages handle what happens after this request finishes differently. PHP throws the things inside of the request away once it’s done, the list, anything the application built, and the next request starts from a completely blank slate. Node.js, for example, doesn’t do this: the same running process keeps going, and whatever the request created in memory just sits there until nothing refers to it anymore, and then a background cleanup process called garbage collection quietly removes it. There’s no single moment where everything gets wiped at once.

## The memory limit

Now let’s look at the situation that matters for this vulnerability: what happens when a request needs more memory than it’s allowed to use. Unlike some other languages, PHP gives every single request its own memory budget, called `memory_limit`, and by default it’s 128 MB. Every time PHP needs to set aside memory for something, data from a database, a new entry in a list, it checks against this budget first. If a request would go over the limit, PHP stops the request right there with a fatal error, known as an out-of-memory error (OOM).

Hitting the memory limit isn’t something dangerous on its own, usually it happens in normal day use. However, the researchers found out that they can exceed this memory limit at the exact time they want, which leads up to both of our vulnerabilities.

To see why this alarmed even the governments, we have to know how PHP behaves when this memory exceeding problem occurs.

## `longjmp`: skipping the way out

Remember how a request normally finishes: application code runs, builds the page, and then an orderly shutdown process cleans everything up before the next request starts. But sometimes a request doesn’t get to finish normally, and memory running out is one of those cases. To see what PHP does then, remember that the work inside a request is nested: one function calls another, which calls another, several layers deep. When something goes wrong in the deepest layer, the ideal way to handle it is to go back up one layer at a time, and let each layer finish or undo whatever it was doing. PHP’s engine is written in C, and C has no built-in way of doing that. So when memory runs out, PHP does something more direct, called `longjmp`: it jumps straight to a single exit point that was set at the very start of the request, skipping every layer in between. Whatever each of those layers was doing, it’s abandoned exactly where it stood. From that exit point, PHP goes straight into the same shutdown process it would have run anyway.

Normally, this is fine. The request is over anyway, and the shutdown process we described earlier throws the whole thing away regardless of whether it finished cleanly or got cut off. The problem is that shutdown doesn’t just discard memory in bulk, it has to walk through certain structures and process them piece by piece, and it has to read some other state on the way. If `longjmp` skipped a step that something else later depends on being complete, shutdown ends up working with something that was never finished. That’s exactly where both vulnerabilities in PHP2Shell come from, and we’ll look at each one next.

## CVE-2026-109618: the entry that was never written

To understand the first vulnerability, CVE-2026-109618, we need to go back to the list we talked about earlier, the one PHP builds at the very start of a request to hold things like your form fields. If you submit a comment with your name and a message, that list is where PHP stores “name: Alp” and “comment: Nice post” as separate entries, before any application code even runs. This bug lives entirely inside that list.

Adding a new entry to that list isn’t one single action, it happens in a specific order. First, PHP increases a counter that tracks how many entries the list holds, this is just a number, it goes from, say, 4 to 5. Only after that does PHP actually set aside memory for the new entry’s contents and write its data into it. So it creates a gap that the counter already says “5 entries,” while the fifth entry itself hasn’t been written yet.

That short gap is what an attacker goes for. If the memory limit is hit right between those two steps, after the counter goes up but before the entry is filled in, `longjmp` fires and skips the rest. PHP walks away having already counted an entry that was never actually written.

Cleanup doesn’t just drop the whole list’s memory at once. It walks through the list entry by entry, using the counter to know how many entries to expect, and for each one it reads two small pieces of information: a tag saying what kind of thing this entry holds, and an address saying where that thing actually lives in memory. Based on the tag, cleanup goes to that address and does whatever releasing that type of data requires.

Now that missing entry causes a problem. The counter says there are 5 entries, but only 4 were actually filled in, the fifth was cut off mid-write by `longjmp`. When cleanup reaches entry 5, it still reads a tag and an address from that spot, because as far as the counter is concerned, entry 5 exists. The problem is, nothing valid was ever written there. Whatever bytes happen to be sitting in that memory, left over from something earlier, get read as if they were a real tag and a real address.

And those leftover bytes are something an attacker can control. If they can get their own bytes to land in the exact memory spot reserved for entry 5, then during cleanup, PHP reads the attacker’s own fake tag and fake address, and follows them, doing whatever the attacker’s fabricated entry tells it to do.

These memory spots aren’t handed out randomly, though. PHP’s memory manager follows a predictable rule: last in, first out. When a piece of memory is freed, it goes onto a kind of waiting list, and the next time PHP needs a chunk of that same size, it hands back the one that was freed most recently.

The attacker uses exactly this predictability. Freeing memory doesn’t erase what was written in it, that would take extra work, it just marks the spot as available again. So if an attacker sends a request containing many fields, with contents they chose, PHP allocates and frees memory for them while parsing the request, and because of last-in-first-out, the most recently freed one of those is exactly what gets handed back next. By carefully timing which of their own fields gets freed right before the gap in entry 5 opens up, the attacker can arrange for their own chosen bytes, a fake tag and a fake address, to be sitting in that exact spot when `longjmp` cuts the process short.

That was the first vulnerability. The second one, CVE-2026-109619, exploits something similar, but in a different piece of memory.

## CVE-2026-109619: the pointer that was never cleared

Go back to what we said earlier: each request gets its own memory, and all of it gets freed once the request is done. But a worker also has memory of its own, separate from any single request’s memory. There can be settings or loaded code, but also pointers, addresses that point into the current request’s memory. For example, PHP might keep track of where the current session’s data sits by storing a pointer to it in this worker-level memory.

This second vulnerability is about what happens to one of those pointers when the request it points to gets freed, but the pointer itself isn’t cleared.

Normally, that pointer itself gets reset near the end of the request, as one of the last steps of its normal finish. If memory runs out while that pointer is still pointing at something real, `longjmp` jumps straight to the exit point and that reset step never runs. The final shutdown still happens, and it frees the request’s memory, but it only frees that memory, it doesn’t touch the pointer. So the pointer is left exactly as it was, still holding the old address.

This is why the attack takes two requests. The first one is what triggers `longjmp` and skips the step that would have cleared the pointer. So the pointer is left pointing at a specific address, except that address no longer holds session data, the request that used to own it is gone, and the memory sits there freed, waiting to be handed out again.

The second request is where the attacker fills that spot. While PHP processes this request’s fields, it keeps asking for small chunks of memory. Because of the same last-in-first-out rule from before, when it asks for a chunk of the right size, it gets the slot that was freed most recently, which is exactly the one the old pointer still points at. PHP then writes the attacker’s field data into it.

The attacker also needs this same request to make PHP use the old pointer, for example by reading the session data it expects to find there. When that happens, PHP goes straight to that address and finds the attacker’s data.

## From bad bytes to running code

In both bugs, PHP ends up trusting bytes the attacker controls, but that alone just means PHP reads or writes something wrong, not that the attacker’s own code starts running. The jump from there to full remote code execution comes down to one distinction: some of what PHP reads from memory is just data, and some of it tells PHP what to do next, which function to call, where to jump to. We actually saw this with the first bug: the tag on each entry is exactly that second kind, it tells cleanup how to handle what follows. If an attacker only controls data, the worst case is usually a crash or a memory leak. If they can also control that “what to do next” part, they’re no longer just feeding PHP bad information, they’re telling it what to execute.

Getting there in practice is hard. It depends on the exact PHP version, the extensions installed, and the server’s configuration, and it usually takes a lot of trial and error to land the right bytes in the right place. This is the part researchers say AI actually changed: work that used to take a skilled team months, mapping out memory layouts, testing variations, adjusting for each target, got compressed into hours for a single researcher. The vulnerability itself had existed for years; what was new in 2026 was how fast it could be turned into something that actually runs.

Why this matters: whatever code the attacker gets to run, runs with the same permissions as the website itself. It can read anything the site can read, database passwords, configuration files, other users’ data, and modify the site just as easily.

## The fix

The only real fix is updating. PHP shipped patched releases for every supported branch on October 21, and even pushed out minimal backports for a few versions that normally no longer get updates, given how serious this was. For anyone who can’t update immediately, there are partial mitigations, but none of them close the hole completely. The strangest-sounding mitigation is setting the memory limit to unlimited. This can prevent the specific attack path that relies on PHP’s configured memory limit, but it is not a complete fix and can introduce other risks. Updating PHP is the only complete solution.

## Steal My Bitcoin

A few days after the patch, someone launched a site called Steal My Bitcoin, running on a deliberately unpatched version of PHP, with a Bitcoin bounty behind it for whoever could break in. A researcher going by KillaBoi did it in around 19 hours, using the same memory trick we just walked through, and published a proof of concept on GitHub.

---

## Sources

Here are the sources I used.

*The vulnerabilities*

- [StackHarbor: PHP2Shell, CVE-2026-109618 and CVE-2026-109619](https://stackharbor.com/en/blog/php2shell-cve-2026-109618-109619-what-we-know/)
- [php-src: `Zend/zend_alloc.c`](https://github.com/php/php-src/blob/master/Zend/zend_alloc.c) (how PHP hands back freed memory)

*How widespread PHP is*

- [W3Techs: PHP usage statistics](https://w3techs.com/technologies/details/pl-php)

*Who went offline*

- [The Register: PHP2Shell puts dozens of UK government services out of service](https://www.theregister.com/security/2026/10/22/php2shell-puts-dozens-of-uk-government-services-out-of-service/5304840)
- [IBTimes SG: Websites go dark worldwide](https://www.ibtimes.sg/websites-go-dark-worldwide-governments-race-patch-critical-php2shell-security-flaw-95384)
- [WorthvieW: Which major websites went offline, and why](https://www.worthview.com/php2shell-crisis-which-major-websites-went-offline-and-why/)
- [medinfoweb: Charité und fünf Universitätskliniken nehmen Webseiten vom Netz](https://medinfoweb.de/charite-und-fuenf-universitaetskliniken-nehmen-webseiten-nach-bsi-warnung-zu-php-vom-netz/) (in German)

*Steal My Bitcoin*

- [KuCoin News: Security researcher exploits PHP2Shell to claim $2,000 Bitcoin bounty](https://www.kucoin.com/news/flash/security-researcher-exploits-php2shell-vulnerability-to-claim-2000-bitcoin-bounty)
- [KillaBoi: StealMyBitcoin-PoC on GitHub](https://github.com/KillaBoi/StealMyBitcoin-PoC)
