# Pikmin comic feed

Nintendo publishes a delightful webcomic drawn by Kino Takahashi based on the world and characters of _Pikmin 4_. While the comic is great (and so is the game!), having to check their website for updates is annoying, so I created an Atom feed for it. You can subscribe to it with whatever feed reader app you already use.

## Development

You'll need to create a .dev.vars file with `PIKMIN_CDN_TOKEN` set to a valid token for Nintendo's CDN. You should be able to obtain one if you know what you're doing.

```sh
pnpm install
pnpm start # starts the dev server
```

## Contributing

If you want to contribute, please open an issue for discussion first.

## License

[AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.en.html)
