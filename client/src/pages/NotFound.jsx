
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-gray-800">404</h1>
      <p className="mt-3 text-gray-500">Page not found</p>

      <Link
        to="/"
        className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
