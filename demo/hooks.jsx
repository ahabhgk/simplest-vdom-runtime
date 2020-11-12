/** @jsx h */
import {
  h,
  createRenderer,
  domRenderOptions,
  createHooksComponent,
  useState,
  useEffect
} from '../src'

const Displayer = createHooksComponent((props) => {
  return <div>{props.children}</div>
})

const App = createHooksComponent((props) => {
  const [count, setCount] = useState(0)
  const inc = () => setCount(count + 1)

  useEffect(() => {
    console.log(count)
  }, [count])

  return (
    <div>
      <button onClick={inc}> + </button>
      <Displayer>{count}</Displayer>
      <div>{count}</div>
    </div>
  )
})

const renderer = createRenderer(domRenderOptions)
const $root = document.querySelector('#root')
renderer.render(<App />, $root)
