# Tiny stack virtual machine

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/biuosa09-create/tiny-stack-vm-01-run-20261122-v2/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/biuosa09-create/tiny-stack-vm-01-run-20261122-v2/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A small interpreter for make.fun's tiny stack ISA v1. `main.ts` (Node 22, no
dependencies) runs every program in `/input/<id>/` on its input and writes
`/output/<id>/stdout.bin` plus `/output/<id>/exit.txt`: 32-bit wrapping
integers, a 256-value data stack, 64-deep calls, 256 words of memory, input
and output, and all ten traps with their own exit codes, under a 1,000,000
step limit and a 65,536 byte output limit.

Run it on the practice set:

```sh
MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts
```

Play more bounties on make.fun: https://make.fun/r/shw861zs
