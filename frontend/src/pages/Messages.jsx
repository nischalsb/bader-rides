import { useState, useEffect, useRef, useContext } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { UserContext } from "../contexts";
import { api } from "../utils/api";
import { formatTimestamp } from "../utils/format";
import Avatar from "../components/Avatar";

export default function Messages({ socket, conversations, setConversations }) {
  const user = useContext(UserContext);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversations.length > 0 && !activeConvo) setActiveConvo(conversations[0].id);
  }, [conversations, activeConvo]);

  useEffect(() => {
    if (!activeConvo) return;
    api(`/api/conversations/${activeConvo}/messages`).then((d) => setMessages(d.messages));
  }, [activeConvo]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.conversationId === activeConvo) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations((prev) => prev.map((c) =>
        c.id === msg.conversationId ? { ...c, lastMessage: { text: msg.text, ts: msg.ts, from: msg.fromUser?.name } } : c
      ));
    };
    socket.on("new-message", handler);
    return () => socket.off("new-message", handler);
  }, [socket, activeConvo]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConvo) return;
    const text = input.trim();
    setInput("");
    try {
      await api(`/api/conversations/${activeConvo}/messages`, { method: "POST", body: JSON.stringify({ text }) });
    } catch { /* message will arrive via socket or we re-fetch */ }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const selectConvo = (id) => { setActiveConvo(id); setMobileShowChat(true); };
  const convo = conversations.find((c) => c.id === activeConvo);

  return (
    <div className="fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">
            {mobileShowChat && <button onClick={() => setMobileShowChat(false)} className="md:hidden mr-3 text-text-tertiary hover:text-text-primary text-lg">&larr;</button>}
            messages
          </h1>
          <p className="text-text-secondary mt-1 hidden md:block">Coordinate with your crew</p>
        </div>
      </div>
      <div className="glass rounded-3xl overflow-hidden" style={{ height: "calc(100vh - 230px)", minHeight: 420 }}>
        <div className="flex h-full">
          <div className={`${mobileShowChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-border-subtle`}>
            <div className="p-4 border-b border-border-subtle"><p className="text-[10px] uppercase tracking-widest text-text-tertiary font-medium">{conversations.length} conversations</p></div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="text-3xl mb-2 opacity-30">💬</div>
                  <p className="text-sm text-text-tertiary">No conversations yet</p>
                  <p className="text-xs text-text-tertiary/60 mt-1">Join a ride to start chatting with the driver</p>
                </div>
              )}
              {conversations.map((c) => {
                const isActive = activeConvo === c.id;
                return (
                  <button key={c.id} onClick={() => selectConvo(c.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 ${isActive ? "bg-cardinal/5 border-l-2 border-cardinal" : "hover:bg-surface-hover border-l-2 border-transparent"}`}>
                    <Avatar initials={c.with?.avatar || "?"} size="sm" glow={isActive} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-sm font-medium ${isActive ? "text-text-primary" : "text-text-secondary"}`}>{c.with?.name}</span>
                        {c.lastMessage && <span className="text-[10px] text-text-tertiary">{formatTimestamp(c.lastMessage.ts)}</span>}
                      </div>
                      <p className="text-[10px] text-cardinal-light/60 mt-0.5">{c.rideLabel}</p>
                      {c.lastMessage && <p className="text-xs text-text-tertiary truncate mt-0.5">{c.lastMessage.text}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`${!mobileShowChat ? "hidden md:flex" : "flex"} flex-col flex-1`}>
            {convo ? (
              <>
                <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-3 glass-light">
                  <Avatar initials={convo.with?.avatar || "?"} size="sm" glow />
                  <div><p className="font-medium text-sm text-text-primary">{convo.with?.name}</p><p className="text-[10px] text-cardinal-light/60">{convo.rideLabel}</p></div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map((m) => {
                    const isMe = m.from === user.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${isMe ? "bg-cardinal text-white rounded-2xl rounded-br-lg" : "bg-surface-hover rounded-2xl rounded-bl-lg text-text-primary"}`}>
                          <p>{m.text}</p>
                          <p className={`text-[10px] mt-1.5 ${isMe ? "text-white/40" : "text-text-tertiary"}`}>{formatTimestamp(m.ts)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-border-subtle">
                  <div className="flex gap-2">
                    <Form.Control type="text" placeholder="Type something..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} className="flex-1 px-4 py-3 rounded-xl text-sm input-dark border-0" />
                    <Button onClick={sendMessage} disabled={!input.trim()} className="px-5 py-3 bg-cardinal text-white text-sm font-semibold rounded-xl btn-glow border-0 disabled:opacity-30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
                    </Button>
                  </div>
                </div>
              </>
            ) : <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">Select a conversation</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
