import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";

const Signup = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <Card className="w-full max-w-md border border-border shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <HeartHandshake className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Account by invitation only</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          OneCare is a multi-company SaaS. Accounts are provisioned by your
          company administrator. Please contact them to receive your
          Company ID, username, and password.
        </p>
        <Button asChild className="w-full">
          <Link to="/login">Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default Signup;
