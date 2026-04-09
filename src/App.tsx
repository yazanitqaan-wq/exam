import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './routes/Login';
import Home from './routes/Home';
import Profile from './routes/Profile';
import AddStudent from './routes/AddStudent';
import StudentDetails from './routes/StudentDetails';
import CreateExam from './routes/CreateExam';
import PublishExam from './routes/PublishExam';
import TakeExam from './routes/TakeExam';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/add-student" element={<AddStudent />} />
      <Route path="/student/:id" element={<StudentDetails />} />
      <Route path="/create-exam" element={<CreateExam />} />
      <Route path="/publish-exam" element={<PublishExam />} />
      <Route path="/take-exam/:sessionId" element={<TakeExam />} />
    </Routes>
  );
}
