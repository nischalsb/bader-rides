import Toast from "react-bootstrap/Toast";
import BSToastContainer from "react-bootstrap/ToastContainer";

export default function AppToasts({ toasts, removeToast }) {
  return (
    <BSToastContainer position="top-center" className="z-[60] mt-20">
      {toasts.map((t) => (
        <Toast key={t.id} onClose={() => removeToast(t.id)} autohide delay={3000}
          className="glass border-0 shadow-2xl rounded-2xl overflow-hidden">
          <Toast.Body className="d-flex align-items-center gap-2 px-4 py-3">
            <span className={`d-inline-block rounded-circle ${t.type === "success" ? "bg-accent-green" : "bg-cardinal-light"}`} style={{ width: 8, height: 8 }} />
            <span className="text-text-primary text-sm fw-medium">{t.message}</span>
          </Toast.Body>
        </Toast>
      ))}
    </BSToastContainer>
  );
}
