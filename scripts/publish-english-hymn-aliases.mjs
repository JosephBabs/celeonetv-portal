import process from "node:process";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  terminate,
  where,
  writeBatch,
} from "firebase/firestore";

const WRITE = process.argv.includes("--write");
const batchSize = 450;

const firebaseConfig = {
  apiKey: "AIzaSyBC3MTssV5lPRkkuf2Sct_UtGjWX1PfYzk",
  authDomain: "celeone-e5843.firebaseapp.com",
  projectId: "celeone-e5843",
  storageBucket: "celeone-e5843.firebasestorage.app",
  messagingSenderId: "275960060318",
  appId: "1:275960060318:web:489485dc1e2be2c1eade8f",
};

function aliasIdFor(id, data) {
  if (String(id || "").startsWith("english_")) return String(id).replace(/^english_/, "anglais_");
  const suffix = [data.hymnNumber || "unknown", data.hymnVariant || ""].filter(Boolean).join("_");
  return `anglais_${String(suffix).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const [englishSnap, anglaisSnap] = await Promise.all([
      getDocs(query(collection(db, "cantiques"), where("language", "==", "english"))),
      getDocs(query(collection(db, "cantiques"), where("language", "==", "anglais"))),
    ]);

    const existingAliasIds = new Set(anglaisSnap.docs.map((item) => item.id));
    const existingNumbers = new Set(
      anglaisSnap.docs.map((item) => `${Number(item.data().hymnNumber || 0)}:${item.data().hymnVariant || ""}`),
    );

    const aliases = englishSnap.docs
      .map((item) => {
        const data = item.data();
        const id = aliasIdFor(item.id, data);
        return {
          id,
          sourceId: item.id,
          numberKey: `${Number(data.hymnNumber || 0)}:${data.hymnVariant || ""}`,
          data: {
            ...data,
            language: "anglais",
            mobileAliasOf: item.id,
            updatedAt: serverTimestamp(),
          },
        };
      })
      .filter((item) => !existingAliasIds.has(item.id) && !existingNumbers.has(item.numberKey));

    console.log(`english source docs: ${englishSnap.size}`);
    console.log(`anglais existing docs: ${anglaisSnap.size}`);
    console.log(`new anglais aliases: ${aliases.length}`);
    console.log("preview:", aliases.slice(0, 8).map((item) => ({ id: item.id, sourceId: item.sourceId, hymnNumber: item.data.hymnNumber, title: item.data.title })));

    if (!WRITE) {
      console.log("Dry run only. Re-run with --write to publish.");
      return;
    }

    for (let index = 0; index < aliases.length; index += batchSize) {
      const batch = writeBatch(db);
      for (const item of aliases.slice(index, index + batchSize)) {
        batch.set(doc(db, "cantiques", item.id), item.data);
      }
      await batch.commit();
      console.log(`Committed ${Math.min(index + batchSize, aliases.length)}/${aliases.length}`);
    }

    console.log("Alias publish complete.");
  } finally {
    await terminate(db);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
