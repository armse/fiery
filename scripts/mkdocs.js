console.time('generated docs')

const fs = require('fs')
const cheerio = require('cheerio')
const Prism = require('prismjs')
require('prismjs/components/prism-jsx')

const twemoji = require('twemoji')

const md = require('markdown-it')({
  html: true,
  highlight: function (str, lang) {
    if (lang === 'js') {
      const code = [ ]
      const match = str.match(/\/\/ Demo: (\w+)/)
      let demoTag = ''
      if (match) {
        const id = match[1]
        code.push(...[
          '<script type="text/babel">',
          str,
          '</script>'
        ])
        demoTag = ` data-demo="${id}"`
      }
      return [
        '<pre class="code mono f6 bg-dark-gray pa3 lh-title"' + demoTag + '>',
        Prism.highlight(str, Prism.languages.jsx),
        '</pre>',
        ...code
      ].join('')
    }
    return ''
  }
})

function section (name, content) {
  return `<!--
####${'#'.repeat(name.length)}####
### ${name} ###
####${'#'.repeat(name.length)}####
-->
${content}

`
}

function postProcessMarkdown (html) {
  const $ = cheerio.load('<body>' + twemoji.parse(html, {
    folder: 'svg',
    ext: '.svg'
  }))
  $('h1').addClass('yellow f-headline lh-solid mb0')
  $('h1 + p').addClass('f2 mt2')
  $('h2').addClass('yellow bt b--orange bw3 mt5 pt4 f1 lh-title')
  $('h3').addClass('gold mt5 f3 lh-title')
  $('strong').addClass('light-yellow')
  $('a').addClass('light-pink')
  $('p > code, li > code').addClass('light-green')
  $('pre:not([class])').addClass('washed-green bg-dark-green pa3')
  $('pre[data-demo]').each(function () {
    const id = $(this).attr('data-demo')
    $(this).before(section('Demo: ' + id, `
      <article class="br3 hidden ba b--black-10 mv4">
        <h1 class="f4 bg-orange light-yellow br3 br--top mv0 pv2 ph3">Demo: ${id}</h1>
        <div class="pa3 bt bg-dark-gray b--white-10" id="${id}"></div>
      </article>
    `))
  })
  return $('body').html()
}

const unlines = a => a.join('\n')

const readme = fs.readFileSync('README.md', 'utf8')
const result = postProcessMarkdown(md.render(readme))
  .replace('<!-- scripts -->', () => unlines([
    section('Require scripts', `
      <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
      <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
      <script src="https://www.gstatic.com/firebasejs/4.6.1/firebase.js"></script>
      <script>
        var config = {
          apiKey: "AIzaSyDLDD_KtKkfAj9sgOHupxUuDt_p8g19bkU",
          authDomain: "fiery-react.firebaseapp.com",
          databaseURL: "https://fiery-react.firebaseio.com",
          projectId: "fiery-react",
          storageBucket: "",
          messagingSenderId: "284926450412"
        };
        firebase.initializeApp(config);
      </script>
      <script src="../umd/fiery.js"></script>
    `),
    section('UI kit', unlines([
      '<script type="text/babel">',
      fs.readFileSync('docs/UI.js', 'utf8'),
      '</script>'
    ]))
  ]))

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="stylesheet" href="https://unpkg.com/tachyons@4.9.0/css/tachyons.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cousine:400" />
  <style>
    pre, code, .mono { font-family: Cousine, monospace; }
    img.emoji { height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em; }
    ${fs.readFileSync('node_modules/prismjs/themes/prism-okaidia.css')}
  </style>
  <title>fiery</title>
</head>
<body class="bg-near-black light-gray f4 sans-serif">
<!--
###########################################################
### THIS FILE IS AUTOMATICALLY GENERATED FROM README.md ###
###########################################################
-->
<main class="mw7 pb5 center lh-copy">
${result}
`

console.timeEnd('generated docs')
fs.writeFileSync('docs/index.html', html)