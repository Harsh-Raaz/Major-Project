export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1628]/55 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[24px] border border-[rgba(0,184,169,0.15)] bg-white p-5 shadow-[0_24px_64px_rgba(10,22,40,0.35)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-[#0A1628]">
            {title}
          </h3>
          <button onClick={onClose} className="cc-btn-secondary">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
