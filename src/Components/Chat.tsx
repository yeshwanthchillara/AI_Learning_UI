import { useEffect, useState } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [contextId, setContextId] = useState<string | null>(null);
    const [healthCheck, setHealthCheck] = useState<{loading: boolean, status: string, error: string | null}>({loading: false, status: "unknown", error: null});

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: input,
                    context_id: contextId,
                }),
            });

            const data = await res.json();

            console.log("Response from backend:", data);

            setContextId(data.context_id); // backend returns it
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: data.answer }
            ]);
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    const checkHealth = async () => {
        try {
            setHealthCheck({loading: true, status: "unknown", error: null});
            const res = await fetch("http://localhost:8000/health");
            if (res.ok) {
                setHealthCheck({loading: false, status: "Healthy", error: null});
            } else {
                setHealthCheck({loading: false, status: "Unhealthy", error: `Status code: ${res.status}`});
            }
        } catch (err) {
            setHealthCheck({loading: false, status: "error", error: (err as Error).message});   
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            checkHealth();
        }, 10000)
        return () => clearInterval(timer);
    }, [])

    return (
        <div style={{ width: "90%", margin: "30px auto", fontFamily: "sans-serif" }}>
            <h2>AI Copilot</h2>
            <div style={{display: "flex", gap: "2rem", alignItems: "center", marginBottom: "1rem"}}>
                <div style={{display: "flex", gap: "2px", alignItems: "center"}}>Health: <div style={{ color: healthCheck.status.toLowerCase() === 'healthy' ? "green" : "red", fontSize: "50px", display: "flex", alignContent: "center" }}>*</div>{healthCheck.status}</div>
            <button onClick={checkHealth} disabled={healthCheck.loading}>
                {healthCheck.loading ? "Checking..." : "Check Health"}
            </button>
            </div>

            <div style={{ border: "1px solid #ccc", borderRadius: 9, padding: 16, height: 400, overflowY: "auto", minHeight: "700px" }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                        <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                        <div>{msg.content}</div>
                    </div>
                ))}
                {loading && <div>Thinking...</div>}
            </div>

            <div style={{ marginTop: 16, display: "flex" }}>
                <input
                    style={{ flex: 1, padding: 8 }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something..."
                    onKeyDown={(e) => {
                        if (!e.shiftKey && e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                />
                <button onClick={sendMessage} style={{ marginLeft: 8 }}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;