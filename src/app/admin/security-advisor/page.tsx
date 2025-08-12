
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Generiere...</span>
        </>
      ) : (
        <>
          <ShieldCheck />
          <span>Richtlinie generieren</span>
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
        title: 'Erfolg',
        description: state.message,
      });
    }
    if (state.error) {
        toast({
            variant: "destructive",
            title: 'Fehler',
            description: state.error,
        });
    }
  }, [state, toast]);

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
       <div className="grid gap-1">
            <h1 className="text-3xl font-bold font-headline md:text-4xl">KI-Sicherheitsberater</h1>
            <p className="text-muted-foreground">Generieren Sie eine Sicherheitsrichtlinie und Empfehlungen mithilfe von KI.</p>
        </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={dispatch}>
          <Card>
            <CardHeader>
              <CardTitle>Konfiguration</CardTitle>
              <CardDescription>
                Beschreiben Sie Ihre Architektur, um eine maßgeschneiderte Sicherheitsrichtlinie zu erhalten.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frameworks">Frameworks</Label>
                <Input id="frameworks" defaultValue="NextJS, Firebase" disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="architectureDescription">
                  Architekturbeschreibung
                </Label>
                <Textarea
                  id="architectureDescription"
                  name="architectureDescription"
                  placeholder="z.B. Next.js mit App Router für das Frontend. Firebase für Authentifizierung (E-Mail/Passwort), Firestore für Datenbank und Firebase Storage für Datei-Uploads. Benutzerdefinierte Rollen 'admin' und 'hotel' werden über benutzerdefinierte Ansprüche verwaltet..."
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
              <CardTitle>Generierte Richtlinie</CardTitle>
              <CardDescription>
                KI-generierte Sicherheitsrichtlinie basierend auf Ihrer Eingabe.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {state.data?.policy ? (
                     <pre className="p-4 bg-secondary rounded-md text-sm whitespace-pre-wrap font-mono">{state.data.policy}</pre>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center">Die generierte Richtlinie wird hier erscheinen.</div>
                )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Empfehlungen</CardTitle>
              <CardDescription>
                KI-generierte Sicherheitsempfehlungen.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {state.data?.recommendations ? (
                     <pre className="p-4 bg-secondary rounded-md text-sm whitespace-pre-wrap font-mono">{state.data.recommendations}</pre>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center">Die generierten Empfehlungen werden hier erscheinen.</div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    