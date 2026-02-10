# 🌳 Tree

<img alt="HTML5" src="https://img.shields.io/badge/html5%20-%23E34F26.svg?&style=for-the-badge&logo=html5&logoColor=white"/> <img alt="CSS" src="https://img.shields.io/badge/css3%20-%231572B6.svg?&style=for-the-badge&logo=css3&logoColor=white"/> <img alt="JavaScript" src="https://img.shields.io/badge/javascript%20-%23323330.svg?&style=for-the-badge&logo=javascript&logoColor=%23F7DF1E"/>

## [Demo](https://waterrmalann.github.io/tree/)   |   [Source](https://github.com/waterrmalann/tree/blob/main/index.js)

A simple zero-deps, vanilla JS web app that generates an ASCII shareable tree diagram from an indentation-based input. Functioning similar to the [tree](https://en.wikipedia.org/wiki/Tree_(command)) command!

**This little tool can take an input like:**

```
src
    index.js
    styles
        app.css
    components
        Button.js
        Card.js
README.md
```

**And generate a neat tree diagram like this:**

```
src
├── index.js
├── styles
│   └── app.css
└── components
    ├── Button.js
    └── Card.js
README.md
```

This project is heavily inspired by [tree](https://tree.nathanfriend.com/) by Nathan Friend. I wanted to build something similar but with zero dependencies.

---

### 🚀 Setup

A live and up to date version of the web app is available [here](https://waterrmalann.github.io/tree/). If you wish to modify the app or host it yourself, you can clone the repo and do whatever you want with it.

1. [Clone the repository](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository-from-github/cloning-a-repository).

```sh
git clone https://github.com/waterrmalann/tree.git
```

#### Running

You're good to go! Just open the `index.html` file in your browser and you should see the app. You could also use a live server extension if you have one installed in your code editor.

#### Development using [Bun](https://bun.sh/)

Ensure you have [Bun](https://bun.sh/) installed to run the development server. You could also use `npm`/`pnpm` to install the dependencies and run the server.

1. Install the dependencies.

```sh
bun install
```

2. This will start a live server. Head to the IP shown in the console.

```sh
bun start
```

---

### 🤝 Contribution

Contributions are always accepted. Feel free to open a pull request to fix any issues or to make improvements you think that should be made. Any contribution will be accepted as long as it doesn't stray too much from the objective of the app. If you're in doubt about whether the PR would be accepted or not, you can always open an issue to get my opinion on it.

License
----

MIT License, see [LICENSE](LICENSE)
