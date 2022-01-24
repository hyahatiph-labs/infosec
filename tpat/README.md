# TPAT: Transaction Proof Authentication Token

In this document, we outline the design for a Transaction Proof Authentication Token \(TPAT\) for future services created by [Hyahatiph Labs](https://github.com/hyahatiph-labs). This specification is open source, with contributions accepted at our [TPAT specification repository](https://github.com/hyahatiph-labs/infosec/tree/main/tpat). TPATs are a new standard protocol for authentication and paid APIs developed by Hyahatiph Labs. TPATs can serve both as authentication, as well as a payment mechanism \(one can view it as a ticket\) for paid APIs. In order to obtain a token, we require the user to pay us over Monero in order to obtain a transaction proof, which itself is a cryptographic component of the final TPAT token.

The implementation of the authentication token is chosen to be transactions, as they allow us to use confirmations as an invalidation mechanism. This system allows us to automate pricing on the fly and allows for a number of novel constructs such as automated tier upgrades. In another light, this can be viewed as a global HTTP 402 reverse proxy at the load balancing level for all our services.

* [Introduction](introduction.md)
* [Authentication flow](authentication-flow.md)
* [Protocol Specification](protocol-specification.md)
* [Transaction Proof](https://www.getmonero.org/resources/user-guides/prove-payment.html)

## Implementations

* [Prokurilo: An HTTP authentication reverse proxy using TPATs](https://github.com/hyahatiph-labs/infosec/tree/main/prokurilo)

## External links / References

* [Get Transaction Proof](https://www.getmonero.org/resources/developer-guides/wallet-rpc.html#get_tx_proof)
* [HTTP/1.1 RFC, Section 6.5.2: 402 Payment Required](https://tools.ietf.org/html/rfc7231#section-6.5.2)
* Primarily inspired by the ground-breaking Lightning Labs research on [LSATs](https://github.com/lightninglabs/LSAT)