# webresock

Yet another client-side reconnecting WebSocket.

This one is using [reconnect-core][2].

## Why?

[ReconnectingWebSocket][3] already exists so why bothering?

[ReconnectingWebSocket][3] is great but it only allows a backoff strategy using [a predictable reconnection time interval](https://github.com/joewalnes/reconnecting-websocket#reconnectinterval).
This means that if 100.000 clients are connected to your websocket server, when it fails and starts over again, it will face 100.000 connection attempts at once.

[webresock][1] tries to fix this issue by providing a way to choose alternate backoff strategies which eventually distribute the clients connection attempts.

## How?

[webresock][1] uses [reconnect-core][2] to handle the WebSocket reconnection in case of a temporary server failure.

In order to use [webresock][1], get the package through bower:

```bash
bower install --save webresock
```

And use it:

```html
<script src="webresock.js"></script>
<script>
  webresock.reconnect({
    // reconnect-core options
    strategy: new webresock.backoff.Backoff({
      // backoff strategy
    })
  })
  .on('connect', (ws) => ws
    .on('message', console.log)
  )
  .connect('ws://whatever')
</script>
```

## Contributing

I'm open to discussing and merging any PR as long as my schedule allows it.



Before sending any PR, ensure that `npm test` still succeeds.
In case of a new feature, ensure that tests are extended accordingly.

## References

[1]: https://github.com/gautaz/webresock
[2]: https://github.com/juliangruber/reconnect-core
[3]: https://github.com/joewalnes/reconnecting-websocket
