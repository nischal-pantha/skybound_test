import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Wind, Navigation2, RotateCcw, Plane, AlertTriangle, CheckCircle2, GraduationCap, Trophy, ArrowRight } from 'lucide-react';
import { calculateWindComponents, type WindComponents, getCrosswindLimit, CROSSWIND_LIMITS } from '@/utils/windComponents';

// Quiz scenario generator
interface QuizScenario {
  windDir: number;
  windSpeed: number;
  runwayHeading: number;
  gustSpeed: number;
}

function generateScenario(): QuizScenario {
  const windDir = Math.round(Math.random() * 36) * 10;
  const windSpeed = Math.round(5 + Math.random() * 30);
  const runwayHeading = Math.round(Math.random() * 36) * 10;
  const gustSpeed = Math.random() > 0.6 ? windSpeed + Math.round(5 + Math.random() * 15) : 0;
  return { windDir, windSpeed, runwayHeading, gustSpeed };
}

interface CrosswindCalculatorProps {
  defaultAircraftName?: string;
}

export const CrosswindCalculator = ({ defaultAircraftName = '' }: CrosswindCalculatorProps) => {
  const [windDir, setWindDir] = useState(270);
  const [windSpeed, setWindSpeed] = useState(15);
  const [gustSpeed, setGustSpeed] = useState(0);
  const [runwayHeading, setRunwayHeading] = useState(280);
  const [aircraftName, setAircraftName] = useState(defaultAircraftName);

  // Quiz state
  const [quizMode, setQuizMode] = useState<'idle' | 'active' | 'answered'>('idle');
  const [scenario, setScenario] = useState<QuizScenario | null>(null);
  const [userHeadwind, setUserHeadwind] = useState('');
  const [userCrosswind, setUserCrosswind] = useState('');
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [lastResult, setLastResult] = useState<{ headwindErr: number; crosswindErr: number; passed: boolean } | null>(null);

  const startQuiz = useCallback(() => {
    const s = generateScenario();
    setScenario(s);
    setUserHeadwind('');
    setUserCrosswind('');
    setLastResult(null);
    setQuizMode('active');
  }, []);

  const submitAnswer = useCallback(() => {
    if (!scenario) return;
    const correct = calculateWindComponents(scenario.windDir, scenario.windSpeed, scenario.runwayHeading);
    const headwindErr = Math.abs(Math.abs(Number(userHeadwind)) - Math.abs(correct.headwind));
    const crosswindErr = Math.abs(Math.abs(Number(userCrosswind)) - correct.crosswindAbs);
    const passed = headwindErr <= 3 && crosswindErr <= 3; // within 3kt tolerance
    setLastResult({ headwindErr, crosswindErr, passed });
    setQuizScore(prev => ({ correct: prev.correct + (passed ? 1 : 0), total: prev.total + 1 }));
    setQuizMode('answered');
  }, [scenario, userHeadwind, userCrosswind]);

  const components = useMemo(() => calculateWindComponents(windDir, windSpeed, runwayHeading), [windDir, windSpeed, runwayHeading]);
  const gustComponents = useMemo(() => gustSpeed > 0 ? calculateWindComponents(windDir, gustSpeed, runwayHeading) : null, [windDir, gustSpeed, runwayHeading]);
  
  const { limit, isDefault } = useMemo(() => getCrosswindLimit(aircraftName), [aircraftName]);
  const pct = limit > 0 ? Math.round((components.crosswindAbs / limit) * 100) : 0;
  const gustPct = gustComponents && limit > 0 ? Math.round((gustComponents.crosswindAbs / limit) * 100) : 0;

  const severity = pct >= 100 ? 'exceeded' : pct >= 85 ? 'warning' : pct >= 65 ? 'caution' : 'safe';
  const severityColor = { safe: 'text-green-600', caution: 'text-yellow-600', warning: 'text-orange-600', exceeded: 'text-red-600' }[severity];
  const severityBg = { safe: 'bg-green-100 border-green-300', caution: 'bg-yellow-100 border-yellow-300', warning: 'bg-orange-100 border-orange-300', exceeded: 'bg-red-100 border-red-300' }[severity];
  const progressColor = { safe: '[&>div]:bg-green-500', caution: '[&>div]:bg-yellow-500', warning: '[&>div]:bg-orange-500', exceeded: '[&>div]:bg-red-500' }[severity];

  const angleDiff = ((windDir - runwayHeading + 360) % 360);
  const displayAngle = angleDiff > 180 ? angleDiff - 360 : angleDiff;

  const reset = () => {
    setWindDir(270);
    setWindSpeed(15);
    setGustSpeed(0);
    setRunwayHeading(280);
  };

  const calculatorContent = (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Crosswind Calculator
          <Badge variant="secondary" className="text-[10px] ml-auto">Training Tool</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Wind className="h-3 w-3" /> Wind Direction (°)
            </Label>
            <Input
              type="number"
              min={0} max={360} step={10}
              value={windDir}
              onChange={e => setWindDir(Number(e.target.value) % 361)}
              className="h-8 text-sm"
            />
            <Slider value={[windDir]} min={0} max={360} step={10} onValueChange={v => setWindDir(v[0])} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Navigation2 className="h-3 w-3" /> Runway Heading (°)
            </Label>
            <Input
              type="number"
              min={0} max={360} step={10}
              value={runwayHeading}
              onChange={e => setRunwayHeading(Number(e.target.value) % 361)}
              className="h-8 text-sm"
            />
            <Slider value={[runwayHeading]} min={0} max={360} step={10} onValueChange={v => setRunwayHeading(v[0])} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Wind Speed (kt)</Label>
            <Input
              type="number"
              min={0} max={100} step={1}
              value={windSpeed}
              onChange={e => setWindSpeed(Math.max(0, Number(e.target.value)))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Gust (kt)</Label>
            <Input
              type="number"
              min={0} max={100} step={1}
              value={gustSpeed}
              onChange={e => setGustSpeed(Math.max(0, Number(e.target.value)))}
              className="h-8 text-sm"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Plane className="h-3 w-3" /> Aircraft
            </Label>
            <Input
              type="text"
              value={aircraftName}
              onChange={e => setAircraftName(e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. Cessna 172"
            />
          </div>
        </div>

        {/* Wind Rose Diagram */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Compass circle */}
              <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
              {/* Cardinal labels */}
              {[['N', 100, 10], ['E', 190, 104], ['S', 100, 198], ['W', 10, 104]].map(([l, x, y]) => (
                <text key={l as string} x={x as number} y={y as number} textAnchor="middle" className="fill-muted-foreground text-[11px] font-semibold">{l as string}</text>
              ))}
              {/* Runway line */}
              {(() => {
                const rwyRad = (runwayHeading - 90) * Math.PI / 180;
                return (
                  <line
                    x1={100 - 70 * Math.cos(rwyRad)} y1={100 - 70 * Math.sin(rwyRad)}
                    x2={100 + 70 * Math.cos(rwyRad)} y2={100 + 70 * Math.sin(rwyRad)}
                    stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" opacity="0.6"
                  />
                );
              })()}
              {/* Wind arrow */}
              {(() => {
                const wRad = (windDir - 90) * Math.PI / 180;
                const len = Math.min(75, 30 + windSpeed * 1.5);
                const ex = 100 + len * Math.cos(wRad);
                const ey = 100 + len * Math.sin(wRad);
                const arrowLen = 12;
                const arrowAngle = 25 * Math.PI / 180;
                return (
                  <g>
                    <line x1="100" y1="100" x2={ex} y2={ey} stroke="hsl(var(--destructive))" strokeWidth="2.5" />
                    <line x1={ex} y1={ey}
                      x2={ex - arrowLen * Math.cos(wRad - arrowAngle)} y2={ey - arrowLen * Math.sin(wRad - arrowAngle)}
                      stroke="hsl(var(--destructive))" strokeWidth="2.5" />
                    <line x1={ex} y1={ey}
                      x2={ex - arrowLen * Math.cos(wRad + arrowAngle)} y2={ey - arrowLen * Math.sin(wRad + arrowAngle)}
                      stroke="hsl(var(--destructive))" strokeWidth="2.5" />
                  </g>
                );
              })()}
              <circle cx="100" cy="100" r="3" fill="hsl(var(--foreground))" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-muted-foreground">
              Angle off: {displayAngle > 0 ? '+' : ''}{displayAngle}°
            </div>
          </div>
        </div>

        {/* Results */}
        <div className={`rounded-lg border p-3 space-y-2 ${severityBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Results</span>
            {severity === 'exceeded' ? (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="h-3 w-3 mr-1" /> LIMIT EXCEEDED
              </Badge>
            ) : severity === 'safe' ? (
              <Badge className="text-[10px] bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> SAFE
              </Badge>
            ) : (
              <Badge className={`text-[10px] ${severity === 'warning' ? 'bg-orange-600' : 'bg-yellow-600'}`}>
                <AlertTriangle className="h-3 w-3 mr-1" /> {severity.toUpperCase()}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Headwind / Tailwind</div>
              <div className="font-bold text-lg">{components.headwindLabel}</div>
              {gustComponents && (
                <div className="text-xs text-orange-600">Gust: {gustComponents.headwindLabel}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Crosswind</div>
              <div className={`font-bold text-lg ${severityColor}`}>{components.crosswindLabel}</div>
              {gustComponents && (
                <div className="text-xs text-orange-600">Gust: {gustComponents.crosswindLabel}</div>
              )}
            </div>
          </div>

          {/* Crosswind limit bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>
                Crosswind limit: {limit}kt
                {isDefault && <span className="text-muted-foreground ml-1">(default)</span>}
              </span>
              <span className={severityColor}>{Math.min(pct, 150)}%</span>
            </div>
            <Progress value={Math.min(pct, 100)} className={`h-2 ${progressColor}`} />
            {gustPct > 0 && (
              <>
                <div className="flex justify-between text-xs text-orange-600">
                  <span>With gusts</span>
                  <span>{Math.min(gustPct, 150)}%</span>
                </div>
                <Progress value={Math.min(gustPct, 100)} className="h-1.5 [&>div]:bg-orange-500" />
              </>
            )}
          </div>
        </div>

        {/* Formula explanation */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground">📐 Formula</div>
          <div className="text-xs font-mono text-muted-foreground">
            Headwind = V × cos(Wind − Rwy)
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            Crosswind = V × sin(Wind − Rwy)
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            = {windSpeed} × cos({windDir}° − {runwayHeading}°) = <span className="font-semibold text-foreground">{components.headwind}kt</span>
          </div>
          <div className="text-xs text-muted-foreground">
            = {windSpeed} × sin({windDir}° − {runwayHeading}°) = <span className="font-semibold text-foreground">{components.crosswindAbs}kt {components.crosswindDir}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={reset} className="w-full">
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </CardContent>
    </Card>
  );

  const quizContent = (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          Crosswind Quiz
          {quizScore.total > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-auto flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {quizScore.correct}/{quizScore.total} ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Calculate headwind and crosswind components mentally, then check your answer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {quizMode === 'idle' && (
          <div className="text-center py-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Test your mental math! Random wind and runway scenarios will be generated.
              Answers within ±3kt are correct.
            </div>
            <Button onClick={startQuiz} className="gap-2">
              <GraduationCap className="h-4 w-4" /> Start Quiz
            </Button>
            {quizScore.total > 0 && (
              <div className="text-xs text-muted-foreground">
                Previous session: {quizScore.correct}/{quizScore.total}
                <Button variant="ghost" size="sm" className="text-xs ml-2" onClick={() => setQuizScore({ correct: 0, total: 0 })}>
                  Reset Score
                </Button>
              </div>
            )}
          </div>
        )}

        {(quizMode === 'active' || quizMode === 'answered') && scenario && (
          <>
            {/* Scenario display */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">SCENARIO</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Wind</div>
                    <div className="font-bold text-sm">
                      {String(scenario.windDir).padStart(3, '0')}° @ {scenario.windSpeed}kt
                      {scenario.gustSpeed > 0 && <span className="text-orange-600"> G{scenario.gustSpeed}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation2 className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Runway</div>
                    <div className="font-bold text-sm">
                      {String(Math.round(scenario.runwayHeading / 10)).padStart(2, '0')}
                      <span className="text-muted-foreground text-xs ml-1">({scenario.runwayHeading}°)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wind rose for scenario */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
                  {[['N', 100, 10], ['E', 190, 104], ['S', 100, 198], ['W', 10, 104]].map(([l, x, y]) => (
                    <text key={l as string} x={x as number} y={y as number} textAnchor="middle" className="fill-muted-foreground text-[11px] font-semibold">{l as string}</text>
                  ))}
                  {(() => {
                    const rwyRad = (scenario.runwayHeading - 90) * Math.PI / 180;
                    return <line x1={100 - 70 * Math.cos(rwyRad)} y1={100 - 70 * Math.sin(rwyRad)} x2={100 + 70 * Math.cos(rwyRad)} y2={100 + 70 * Math.sin(rwyRad)} stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" opacity="0.6" />;
                  })()}
                  {(() => {
                    const wRad = (scenario.windDir - 90) * Math.PI / 180;
                    const len = Math.min(75, 30 + scenario.windSpeed * 1.5);
                    const ex = 100 + len * Math.cos(wRad);
                    const ey = 100 + len * Math.sin(wRad);
                    return (
                      <g>
                        <line x1="100" y1="100" x2={ex} y2={ey} stroke="hsl(var(--destructive))" strokeWidth="2.5" />
                        <line x1={ex} y1={ey} x2={ex - 12 * Math.cos(wRad - 0.44)} y2={ey - 12 * Math.sin(wRad - 0.44)} stroke="hsl(var(--destructive))" strokeWidth="2.5" />
                        <line x1={ex} y1={ey} x2={ex - 12 * Math.cos(wRad + 0.44)} y2={ey - 12 * Math.sin(wRad + 0.44)} stroke="hsl(var(--destructive))" strokeWidth="2.5" />
                      </g>
                    );
                  })()}
                  <circle cx="100" cy="100" r="3" fill="hsl(var(--foreground))" />
                </svg>
              </div>
            </div>

            {/* Answer inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Your Headwind (kt)</Label>
                <Input
                  type="number"
                  value={userHeadwind}
                  onChange={e => setUserHeadwind(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="e.g. 12"
                  disabled={quizMode === 'answered'}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Your Crosswind (kt)</Label>
                <Input
                  type="number"
                  value={userCrosswind}
                  onChange={e => setUserCrosswind(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="e.g. 8"
                  disabled={quizMode === 'answered'}
                />
              </div>
            </div>

            {quizMode === 'active' && (
              <Button onClick={submitAnswer} disabled={!userHeadwind || !userCrosswind} className="w-full gap-2">
                <CheckCircle2 className="h-4 w-4" /> Check Answer
              </Button>
            )}

            {quizMode === 'answered' && lastResult && scenario && (() => {
              const correct = calculateWindComponents(scenario.windDir, scenario.windSpeed, scenario.runwayHeading);
              return (
                <div className={`rounded-lg border p-3 space-y-2 ${lastResult.passed ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800' : 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800'}`}>
                  <div className="flex items-center gap-2">
                    {lastResult.passed ? (
                      <Badge className="bg-green-600 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> CORRECT!</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" /> INCORRECT</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">±3kt tolerance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Correct Headwind</div>
                      <div className="font-bold">{correct.headwindLabel}</div>
                      <div className="text-xs text-muted-foreground">Your answer: {userHeadwind}kt (off by {lastResult.headwindErr.toFixed(1)}kt)</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Correct Crosswind</div>
                      <div className="font-bold">{correct.crosswindLabel}</div>
                      <div className="text-xs text-muted-foreground">Your answer: {userCrosswind}kt (off by {lastResult.crosswindErr.toFixed(1)}kt)</div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 text-xs font-mono text-muted-foreground">
                    {scenario.windSpeed} × cos({scenario.windDir}° − {scenario.runwayHeading}°) = {correct.headwind}kt<br/>
                    {scenario.windSpeed} × sin({scenario.windDir}° − {scenario.runwayHeading}°) = {correct.crosswindAbs}kt {correct.crosswindDir}
                  </div>
                </div>
              );
            })()}

            {quizMode === 'answered' && (
              <Button onClick={startQuiz} className="w-full gap-2">
                <ArrowRight className="h-4 w-4" /> Next Scenario
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="calculator" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-8">
        <TabsTrigger value="calculator" className="text-xs gap-1">
          <Calculator className="h-3 w-3" /> Calculator
        </TabsTrigger>
        <TabsTrigger value="quiz" className="text-xs gap-1">
          <GraduationCap className="h-3 w-3" /> Quiz Mode
        </TabsTrigger>
      </TabsList>
      <TabsContent value="calculator" className="mt-2">
        {calculatorContent}
      </TabsContent>
      <TabsContent value="quiz" className="mt-2">
        {quizContent}
      </TabsContent>
    </Tabs>
  );
};
