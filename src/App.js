import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import AadhaarResultPage from './AadhaarResultPage'; // added import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/aadhaar" element={<AadhaarResultPage />} /> {/* new route */}
      </Routes>
    </Router>
  );
}

export default App;
