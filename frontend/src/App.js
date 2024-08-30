import './App.css';
import Admin from './views/admin';
import Home from './views/home';
import Navbar from './views/navbar';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Admin />
      {/* <Home /> */}
    </div>
  );
}

export default App;
