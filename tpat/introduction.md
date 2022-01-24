# Introduction

In this document we aim to specify a protocol standard of what we call an `TPAT`. `TPAT` stands for Transaction Proof Authentication Token. TPATs are a new standard protocol for authentication and paid APIs developed by Hyahatiph Labs. TPATs can serve both as authentication, as well as a payment mechanism \(one can view it as a ticket\) for paid APIs. By leveraging the TPATs, a service or business is able to offer a new tier of paid APIs that sit between free, and subscription: pay as you go.

One can view TPATs as a fancy authentication token or cookie. They differ from regular cookies in that they're a cryptographically verifiable bearer credential. The TPAT specification uses a combination of `HTTP` as well as the Monero Network to create a seamless end-to-end payment+authentication flow for the next-generation of anonymous payments for APIs.

## The Forgotten HTTP Error Code

HTTP as we know it today uses a number of _error_ codes to allow developers to easily consume APIs created by service providers. As an example, the well known `200 OK` error code indicates a successful HTTP response. The `401 Unauthorized` is sent when a client attempts to access a page or resource that requires authentication, and so on. A large number of other error code exist, with some more commonly used than others. One error code which has widely been underutilized is: `402 Payment Required`. As the name entails, this code is returned when a client attempts to access a resource that they haven't _paid for_ yet. In most versions of the HTTP specification, this code is marked as being "reserved for future use". Many speculate that it was intended to be used by some sort of digital cash or micropayment scheme, which didn't yet exist at the time of the initial HTTP specification drafting.

## Authentication and API Payments in an anonymous web

Monero has the potential to serve as the de-facto payment method to access services and resources on the anonymous web. In this new web, rather than a user being tracked across the web with invisible pixels to serve invasive ads, or users needing to give away their emails subjecting themselves to a lifetime of spam and tracking, what if a user was able to _pay_ for a service and in the process obtain a ticket/receipt which can be used for future authentication and access?

In this web, email addresses and passwords are a thing of the past. Instead _cryptographic bearer credentials_ are purchased and presented by users to access services and resources. In this new web, credit cards no longer serve as a gatekeeper to all the amazing experiences that have been created. TPATs enable the creation of a new more global, more private, more developer friendly web.

At this point, curious users may be wondering: How would such a scheme work? Are the payment and receipt steps atomic? Why can't a user just forge one of these "tickets"?

## HTTP + Transaction Proof + Monero = TPAT

An TPAT is essentially a ticket obtained over Monero for a particular service or resource. The ticket itself _encodes_ what resource it's able to access. It can be copied, or given to a friend so they can access that same resources. On the other end, services can mint special tickets for particular users, rotate, upgrade, and even revoke the tickets.

The tickets themselves are actually transactions. The TPAT protocol allows a user to _atomically_ purchase one of these tickets for piconeros over the Monero Network. Partial TPATs are served over HTTP \(or HTTP/2\) when a user attempts to access a resource that requires payment \(`402 Payment Required`\) along with a subaddress. This _partial_ TPAT can then be converted into a _complete_ TPAT by paying the subaddress, and obtaining the transaction proof.

With proper integration at end clients, Monero wallets, mobile application, browsers \(and extensions\), the above flow has potential to be even more seamless than the credit card flow users are accustomed to today. It's also more _private_ as the server doesn't need to know _who_ paid for the ticket, only that it was successfully paid for.

## Example Applications and Use Cases

The TPAT standard enables a number of new use cases, pricing models, and applications to be built, all using the Monero Network as a primary money rail. As the standard is also defined over _HTTP/2_, it can be naturally extended to also support gating access to existing _gRPC_ services. This is rather powerful as it enables a _strong decoupling_ of authentication+payment logic from application logic.

As TPATs leverage the Monero Network for its payment capabilities, they also enable the easy creation of _metered_ APIs. A metered API is one where the user is able to pay for the target resource or service as they go rather than needing to commit to a subscription up front. Developers can use TPATs to create applications that charge users on an on going basis for resources like compute or disk space. If the user stops paying, then the resource can be suspended, collected, and re-allocated for another paying user.

Additionally, TPATs also enable innovation at the API _architecture_ level. One example is automated tier upgrades. Many APIs typically offer several tiers which allow users to gain access to more or additional resources as they climb up the ladder. Typically, a user must _manually_ navigate a web-page to request an upgrade to a higher tier, or downgrade to a lower tier. With the TPAT standard, tier upgrades can easily be automated: the user hits a new endpoint to obtain an _upgraded_ TPAT which _encodes_ additional functionality or increased resource access compared to the prior tier. Services can even leverage TPATs for A/B Testing by giving subsets of users distinct TPATs which when submitted to the service, render a slightly different version of the target resource or service.

## Conclusion

In this section we've provided an overview of the lineage, motivation, workflow, potential and uses cases for the TPAT standard. In the later sections, we'll dive a bit deeper, fully specifying the TPAT protocol end to end.
