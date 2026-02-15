import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    await signInWithEmailAndPassword(auth,email,password);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={login} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <input
          className="input"
          placeholder="Email"
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input mt-3"
          placeholder="Password"
          onChange={e=>setPassword(e.target.value)}
        />

        <button className="btn-primary mt-4 w-full">
          Login
        </button>
      </form>
    </div>
  );
}
