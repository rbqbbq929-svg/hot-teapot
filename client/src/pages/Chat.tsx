import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Send, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const templateId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: template } = trpc.promptTemplates.getById.useQuery({ id: templateId });
  const { data: messages, refetch: refetchMessages } = trpc.messages.list.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  const createConversation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      setConversationId(data[0].insertId);
    },
  });

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      refetchMessages();
      setInput("");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && template && !conversationId) {
      createConversation.mutate({
        templateId: template.id,
        title: template.title,
      });
    }
  }, [isAuthenticated, template, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !conversationId || sendMessage.isPending) return;
    sendMessage.mutate({
      conversationId,
      content: input.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExportMessage = async (messageId: number) => {
    const element = document.getElementById(`message-${messageId}`);
    if (!element) {
      toast.error("无法找到消息元素");
      return;
    }

    try {
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `message-${messageId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("导出成功");
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请重试");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">模板不存在</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 rounded-lg" />
            <div>
              <h1 className="font-bold text-foreground">{template.title}</h1>
              {template.description && (
                <p className="text-xs text-muted-foreground">{template.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">欢迎, {user?.name}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <Card
                      id={`message-${msg.id}`}
                      className={`${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground"
                      }`}
                    >
                      <div className="p-4">
                        {msg.role === "assistant" ? (
                          <Streamdown>{msg.content}</Streamdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </Card>
                    {msg.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="self-start"
                        onClick={() => handleExportMessage(msg.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        导出为图片
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <Card className="bg-card text-card-foreground">
                    <div className="p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">开始你的对话吧</p>
              <p className="text-sm text-muted-foreground">在下方输入框中输入你的问题</p>
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <div className="border-t bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的问题..."
              disabled={sendMessage.isPending || !conversationId}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending || !conversationId}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
