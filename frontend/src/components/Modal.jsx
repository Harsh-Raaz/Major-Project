export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-blue-950">{title}</h3>
          <button onClick={onClose} className="rounded-lg border border-blue-200 px-3 py-1 text-sm text-blue-700">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

