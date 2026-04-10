import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from './routes/Login';
import Home from './routes/Home';
import Profile from './routes/Profile';
import AddStudent from './routes/AddStudent';
import StudentDetails from './routes/StudentDetails';
import CreateExam from './routes/CreateExam';
import PublishExam from './routes/PublishExam';
import TakeExam from './routes/TakeExam';
import TeacherGrades from './routes/TeacherGrades';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/add-student",
    element: <AddStudent />,
  },
  {
    path: "/student/:id",
    element: <StudentDetails />,
  },
  {
    path: "/create-exam",
    element: <CreateExam />,
  },
  {
    path: "/publish-exam",
    element: <PublishExam />,
  },
  {
    path: "/take-exam/:sessionId",
    element: <TakeExam />,
  },
  {
    path: "/grades",
    element: <TeacherGrades />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
