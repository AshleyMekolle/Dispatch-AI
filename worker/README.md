# worker/

Deployment entrypoint for the background execution worker (lands in
Milestone 5, with the execution engine).

**Design note:** the worker's *code* lives inside the backend package
(`backend/app/workers/`) because it shares models, repositories, and
integration adapters with the API — two Python packages would force a
third "common" package and circular version management. This folder holds
only what is unique to the worker *runtime*: its Dockerfile and process
entrypoint. Same code, two processes.
