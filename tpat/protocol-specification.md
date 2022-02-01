# Protocol Specification

## Introduction

In this chapter, we outline the specification for the abstract TPAT HTTP protocol. This is intended to be along the lines of the document we would submit if we were submitting the TPAT HTTP protocol to a standards committee. For more details on the higher-level purpose and motivations behind TPAT, please [see this chapter](introduction.md).

## Specification

This section defines the "TPAT" authentication scheme, which transmits credentials as `<hash>:<tx_proof>` pairs, where the hash is encoded as hex and the transaction proof is sent clear.  
This scheme is not considered to be a secure method of user authentication unless used in conjunction with some external secure system such as TLS, as the information is passed in clear text. This scheme is meant to be used with i2p.

The TPAT authentication scheme is based on the model that the client needs to authenticate itself with a hash and transaction proof for each backend service it wants to access. The server will service the request only if it can validate the hash and transaction proof for the particular backend service requested.

The TPAT authentication scheme utilizes the Authentication Framework specified in [_RFC 7235_](https://tools.ietf.org/html/rfc7235) as follows.

In challenges: the scheme name is "TPAT". Note that the scheme name is case-insensitive. For credentials, the syntax is:

`hash` → [_&lt;hex encoding&gt;_](https://tools.ietf.org/html/rfc3548#section-3), 
`transaction proof` → [_&lt;hex encoding&gt;_](https://tools.ietf.org/html/rfc3548#section-6)  
`token` → hash ":" transaction proof

Specifically, the syntax for "token" specified above is used, which can be considered comparable to the [_"token68" syntax_](https://tools.ietf.org/html/rfc7235#section-2.1) used for HTTP basic auth.

### Reusing Credentials

TPATs are intended to be reused until they are revoked and the server issues a new challenge in response to a client request containing a newly invalid TPAT. Possible revocation conditions include: expiry date, exceeded N usages, volume of usages in a certain time period necessitating a tier upgrade, and potentially others \(discussed further in the higher-level design document\).

TPATs could be configured for use on a per-backend-service basis or for all Hyahatiph Labs services. This flexibility is afforded because all services are going to be gated by the same TPAT proxy, which verifies all hashes for all backend services.

### Security Considerations

If a client’s TPAT is intercepted by Mallory, which is possible if the transmission is not encrypted in some way such as TLS, the TPAT can be used by Mallory and the TPAT proxy would not be able to distinguish this usage as illicit.

TPAT authentication is also vulnerable to spoofing by counterfeit servers. If a client slightly mistypes the URL of a desired backend service, they become vulnerable to spoofing attacks if connecting to a server that maliciously stores their TPAT and uses it for their own purposes. This attack could be addressed by requiring the user of the TPAT to have a specific IP address. However, there are downsides to this approach; for example, if a user switches WiFi networks, their token becomes unusable.

## HTTP Specification

In this section, we specify the protocol for the HTTP portion of the TPAT proxy.

Upon receipt of a request for a URI of an TPAT-proxied backend service that lacks credentials or contains an TPAT that is invalid or insufficient in some way, the server should reply with a challenge using the 402 \(Payment Required\) status code. **Officially, in the HTTP RFC documentation, status code 402 is**  [_**"reserved for future use"**_](https://tools.ietf.org/html/rfc7231#section-6.5.2)  **-- but this document assumes the future has arrived.**

Alongside the 402 status code, the server should specify the `WWW-Authenticate` header \([_\[RFC7235\], Section 4.1_](https://tools.ietf.org/html/rfc7235#section-4.1)\) field to indicate the TPAT authentication scheme and the hash needed for the client to form a complete TPAT.

For instance:

```text
 HTTP/1.1 402 Payment Required

Date: Mon, 04 Feb 2014 16:50:53 GMT

www-authenticate: TPAT address="54gqcJZAtgz...", min_amt="1000000", ttl="30", hash="hash123...", signature="OutProofV123...", ast="60"
```

where `"hash123"` is the hash that the client must include for each of its authorized requests and `"OutProofV123..."` is the transaction proof that must be included for each of its authorized requests.

In other words, to receive authorization, the client:

1. Pays the subaddress from the server, then generate transaction proof
2. Constructs the TPAT by concatenating the hash, a single
   colon \(":"\), and the transaction proof.

Since the hash and the transaction proof are both binary data encoded in an ASCII based format, there should be no problem with either containing control characters or colons \(see "CTL" in [_Appendix B.1 of \[RFC5234\]_](https://tools.ietf.org/html/rfc5234#appendix-B.1)\). If a user provides a hash or transaction proof containing any of these characters, this is to be considered an invalid TPAT and should result in a 402 and authentication information as specified above.

If a client wishes to send the hash `"hash123..."` and the transaction proof `"OutProofV123..."`, they would use the following header field:

```text
Authorization: TPAT hash123:OutProofV123
```

### Subaddress-Override

This is a new concept that will allow a sort of royalty-based payment system. Say you host
a platform for content creators. They pay you, the owner of the board, but how can the TPAT system stay
in place in such a way that creators are paid via the same concept? By adding an optional third
segment to the token, APIs that "belong" to creators can override the platform's subaddress in a
system like the `prokurilo` proxy server. This allows the proxy server to verify payments dynamically
without major modifications to an existing service. For instance, a `username` and `password`
form could be replaced by `hash`, `proof`, `subaddress` when creating content. Users only interacting with content but not creating could then pay to the creator subaddress using `hash` and `proof` only.

```text
Authorization: TPAT hash123:OutProofV123:SubAddressOverride
```