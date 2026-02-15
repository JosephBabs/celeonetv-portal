import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const navigate = useNavigate();

  const register = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    await createUserWithEmailAndPassword(auth,email,password);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={register} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Create account</h2>

        <input className="input" placeholder="Email" onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="input mt-3" placeholder="Password" onChange={e=>setPassword(e.target.value)} />

        <button className="btn-primary mt-4 w-full">
          Sign up
        </button>
      </form>
    </div>
  );
}
