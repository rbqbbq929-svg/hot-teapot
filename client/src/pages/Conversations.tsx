import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

export default function Conversations() {
  const { user, isAuthenticated } = useAuth();
  const { data: conversations, isLoading } = trpc.conversations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to home if not authenticated (conversations require login)
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
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
            <h1 className="text-xl font-bold text-foreground">我的对话</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">欢迎, {user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/chat/${conversation.templateId || 0}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-foreground">{conversation.title}</CardTitle>
                    <CardDescription>
                      创建于 {new Date(conversation.createdAt).toLocaleDateString("zh-CN")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      继续对话
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">还没有任何对话记录</p>
            <Link href="/">
              <Button>开始第一个对话</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
