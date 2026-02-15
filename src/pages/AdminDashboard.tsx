/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // package form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDays, setPDays] = useState("30");

  useEffect(() => {
    const q1 = query(collection(db, "channel_requests"), orderBy("createdAt", "desc"));
    const u1 = onSnapshot(q1, (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

    const q2 = query(collection(db, "packages"), orderBy("createdAt", "desc"));
    const u2 = onSnapshot(q2, (snap) => setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

    return () => {
      u1();
      u2();
    };
  }, []);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

  const approve = async (r: any) => {
    // For now: only flip status.
    // Next step: call Node to generate streamKey + create channel doc, then write to Firestore.
    await updateDoc(doc(db, "channel_requests", r.id), {
      status: "approved",
      updatedAt: serverTimestamp(),
    });
    alert("Approved. Next step: generate streamKey via Node + write back to Firestore.");
  };

  const reject = async (r: any) => {
    await updateDoc(doc(db, "channel_requests", r.id), {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
  };

  const createPackage = async () => {
    if (!pName.trim()) return alert("Package name required");
    if (!pPrice.trim()) return alert("Price required");
    await addDoc(collection(db, "packages"), {
      name: pName.trim(),
      price: pPrice.trim(),
      durationDays: Number(pDays || "30"),
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setPName("");
    setPPrice("");
    setPDays("30");
  };

  const togglePackage = async (pkg: any) => {
    await updateDoc(doc(db, "packages", pkg.id), {
      active: !pkg.active,
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-2xl font-black">Admin</div>
        <div className="mt-2 text-slate-600">
          Requests, packages. (Paiements/refunds + streamKey provisioning via Node next.)
        </div>
      </div>

      {/* Requests */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black">Channel Requests</div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-800">
            Pending: {pending.length}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black">{r.displayName}</div>
                  <div className="text-sm text-slate-600">/{r.channelName}/live • {r.category || "—"}</div>
                  <div className="mt-1 text-sm text-slate-600">{r.description || "—"}</div>
                </div>
                <Pill status={r.status} />
              </div>

              {r.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => approve(r)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 font-extrabold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(r)}
                    className="rounded-2xl bg-rose-600 px-4 py-2 font-extrabold text-white hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              No requests yet.
            </div>
          ) : null}
        </div>
      </div>

      {/* Packages */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-lg font-black">Subscription Packages</div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={pName}
            onChange={(e) => setPName(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Name (Starter)"
          />
          <input
            value={pPrice}
            onChange={(e) => setPPrice(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Price (5000 FCFA)"
          />
          <input
            value={pDays}
            onChange={(e) => setPDays(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Duration days (30)"
          />
        </div>

        <button
          onClick={createPackage}
          className="mt-3 rounded-2xl bg-teal-600 px-5 py-3 font-extrabold text-white hover:bg-teal-700"
        >
          Create Package
        </button>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {packages.map((p) => (
            <div key={p.id} className="rounded-3xl border border-slate-200 p-5">
              <div className="text-lg font-black">{p.name}</div>
              <div className="mt-1 text-2xl font-black">{p.price}</div>
              <div className="mt-1 text-sm text-slate-600">{p.durationDays} days</div>
              <button
                onClick={() => togglePackage(p)}
                className={`mt-4 w-full rounded-2xl px-4 py-3 font-extrabold ${
                  p.active ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                {p.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pill({ status }: any) {
  const map: any = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
  };
  return (
    <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </div>
  );
}
