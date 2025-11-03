import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import CourseTimetable from './Course'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <CourseTimetable />
    </>

  )
}

export default App
