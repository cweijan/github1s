import { openLink, hotKeys, imageParser, toolbar, windowHack } from "./util.js";

handler.on("open", (md) => {
  if (md.autoTheme) {
    window.addThemeCss()
  }
  const editor = new Vditor('vditor', {
    value: md.content,
    height: document.documentElement.clientHeight,
    outline: {
      enable: true,
      position: 'left',
    },
    mode: 'wysiwyg',
    tab: '\t',
    "preview": {
      "markdown": {
        "toc": true
      },
      hljs: {
        style: 'github'
      },
      math: {
        engine: 'KaTeX',
        "inlineDigit": true
      }
    },
    toolbar,
    input(content) {
      handler.emit("save", content)
    },
    upload: {
      url: '/image',
      accept: 'image/*',
      handler(files) {
        let reader = new FileReader();
        reader.readAsBinaryString(files[0]);
        reader.onloadend = () => {
          handler.emit("img", reader.result)
        };
      }
    },
    hint: {
      emoji: {},
      extend: hotKeys
    }
  })

  openLink()
  windowHack(editor);
  console.log(md)
  if (md.viewAbsoluteLocal) {
    imageParser()
  }

})

handler.emit("init")

