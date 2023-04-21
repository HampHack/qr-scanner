import { useState } from "react";
import { QrReader } from "react-qr-reader";
import type { Result } from "@zxing/library";
export default function Home() {
  const [qr, setQr] = useState<Result>();

  const handleScan = () => {
    fetch("/api/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: qr?.getText() }),
    })
      .then((res) => res.json())
      .then((reg) => {
        alert(
          `Signed in ${reg[0].fields.Name}! T-Shirt Size: ${reg[0].fields["T-Shirt Size"]}`
        );
        setQr(undefined);
      });
  };

  return (
    <main className="flex flex-col justify-between w-screen h-screen">
      <div>
        <h1 className="pt-12 text-xl font-bold text-center">Scan QR Code</h1>
        <QrReader
          onResult={(res, err) => {
            if (res) {
              setQr(res);
            }
          }}
          constraints={{
            facingMode: "environment",
          }}
          className="w-full"
        />
      </div>
      {qr && (
        <button
          className="w-full h-24 mb-12 text-2xl font-bold text-center text-white bg-green-500"
          onClick={handleScan}
        >
          Attended
        </button>
      )}
    </main>
  );
}
