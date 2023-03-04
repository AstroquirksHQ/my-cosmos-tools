# my-cosmos-tools

An osmo address will give you a stars and a juno address

## Install dependencies 

```npm install --dev```

## Compile

```tsc```

## run commands
```
> node dist/AddrMatcher.js 
Options:
      --version   Show version number                                  [boolean]
  -f, --from-csv  Path to the input CSV file                 [string] [required]
  -r, --rpc       RPC endpoint to connect to                            [string]
      --to        The token you want to tranform the address to (ie : stars)
                                                                        [string]
  -h, --help      Show help                                            [boolean]
```