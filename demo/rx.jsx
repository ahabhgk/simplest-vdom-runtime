import {  } from 'rxjs'
import { createRenderer } from '../src/core'

const App = createRxComponent((props) => {
  return
})

const renderer = createRenderer(domRenderOptions)
const $root = document.querySelector('#root')
renderer.render(<App />, $root)
