# node-dali
Node.js DALI protocol implementation. It provides 2 things:
 - General classes to create DALI Commands `DALICommand` and parse DALI Responses `DALIResponse`
 - Classess with vendor specific implementation of communication with DALI Masters (controllers).
So far only Foxtron DALI ASCII over Serial Port (Foxtron DALI232) is supported.
