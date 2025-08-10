
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getSecurityPolicy, type State } from './actions';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <ShieldCheck />
          <span>Generate Policy</span>
        </>
      )}
    </Button>
  );
}

export default function SecurityAdvisorPage() {
  const initialState: State = { data: null, error: null };
  const [state, dispatch] = useActionState(getSecurityPolicy, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      toast({
        title: 'Success',
        description: state.message,
      });
    }
    if (state.error) {
        toast({
            variant: "destructive",
            title: 'Error',
            description: state.error,
        });
    }
  }, [state, toast]);

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
       <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Security Policy Advisor</h1>
            <p className="text-muted-foreground">Generate a security policy and recommendations using AI.</p>
        </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={dispatch}>
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Describe your architecture to get a tailored security policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frameworks">Frameworks</Label>
                <Input id="frameworks" defaultValue="NextJS, Firebase" disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="architectureDescription">
                  Architecture Description
                </Label>
                <Textarea
                  id="architectureDescription"
                  name="architectureDescription"
                  placeholder="e.g., Using Next.js with App Router for the frontend. Firebase for authentication (email/password), Firestore for database, and Firebase Storage for file uploads. Custom roles 'admin' and 'hotel' are managed via custom claims..."
                  rows={8}
                />
                {state.error && <p className="text-sm text-destructive">{state.error}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </Card>
        </form>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Policy</CardTitle>
              <CardDescription>
                AI-generated security policy based on your input.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {state.data?.policy ? (
                     <pre className="p-4 bg-secondary rounded-md text-sm whitespace-pre-wrap font-mono">{state.data.policy}</pre>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center">The generated policy will appear here.</div>
                )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                AI-generated security recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {state.data?.recommendations ? (
                     <pre className="p-4 bg-secondary rounded-md text-sm whitespace-pre-wrap font-mono">{state.data.recommendations}</pre>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center">The generated recommendations will appear here.</div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
