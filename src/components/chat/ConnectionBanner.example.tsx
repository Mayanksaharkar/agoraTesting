/**
 * ConnectionBanner Component Examples
 * Demonstrates various states and usage patterns
 */

import React, { useState } from 'react';
import { ConnectionBanner, ConnectionStatus } from './ConnectionBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectionBannerExamples() {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [reconnectionAttempt, setReconnectionAttempt] = useState(0);

  const handleReconnect = () => {
    console.log('Reconnect button clicked');
    setStatus('reconnecting');
    setReconnectionAttempt(1);
    
    // Simulate reconnection
    setTimeout(() => {
      setStatus('connected');
      setReconnectionAttempt(0);
    }, 2000);
  };

  const simulateDisconnect = () => {
    setStatus('disconnected');
    setReconnectionAttempt(0);
  };

  const simulateReconnecting = () => {
    setStatus('reconnecting');
    setReconnectionAttempt(3);
  };

  const simulateConnect = () => {
    setStatus('connected');
    setReconnectionAttempt(0);
  };

  return (
    <div className="space-y-8 p-8">
      <Card>
        <CardHeader>
          <CardTitle>ConnectionBanner Component</CardTitle>
          <CardDescription>
            Displays connection status and provides reconnection controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interactive Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Interactive Demo</h3>
            
            {/* Connection Banner */}
            <div className="border rounded-lg overflow-hidden">
              <ConnectionBanner
                status={status}
                onReconnect={handleReconnect}
                reconnectionAttempt={reconnectionAttempt}
                maxReconnectionAttempts={10}
              />
              
              {/* Placeholder content to show banner positioning */}
              <div className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Current Status: <span className="font-semibold">{status}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The banner appears above this content when not connected
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={simulateConnect}
                disabled={status === 'connected'}
              >
                Simulate Connected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={simulateDisconnect}
                disabled={status === 'disconnected'}
              >
                Simulate Disconnected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={simulateReconnecting}
                disabled={status === 'reconnecting'}
              >
                Simulate Reconnecting
              </Button>
            </div>
          </div>

          {/* Static Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Static Examples</h3>

            {/* Connected State */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Connected (Hidden)</p>
              <div className="border rounded-lg overflow-hidden">
                <ConnectionBanner status="connected" />
                <div className="p-4 bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    No banner shown when connected
                  </p>
                </div>
              </div>
            </div>

            {/* Disconnected State */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Disconnected</p>
              <div className="border rounded-lg overflow-hidden">
                <ConnectionBanner
                  status="disconnected"
                  onReconnect={() => console.log('Reconnect clicked')}
                />
              </div>
            </div>

            {/* Reconnecting State */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Reconnecting</p>
              <div className="border rounded-lg overflow-hidden">
                <ConnectionBanner status="reconnecting" />
              </div>
            </div>

            {/* Reconnecting with Progress */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Reconnecting with Progress</p>
              <div className="border rounded-lg overflow-hidden">
                <ConnectionBanner
                  status="reconnecting"
                  reconnectionAttempt={5}
                  maxReconnectionAttempts={10}
                />
              </div>
            </div>

            {/* Disconnected without Reconnect Button */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Disconnected (No Reconnect Button)</p>
              <div className="border rounded-lg overflow-hidden">
                <ConnectionBanner status="disconnected" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
            {`import { ConnectionBanner } from '@/components/chat/ConnectionBanner';
import { useChat } from '@/contexts/ChatContext';

function ChatWindow() {
  const { isConnected } = useChat();
  
  const handleReconnect = () => {
    // Trigger manual reconnection
    socket.connect();
  };
  
  return (
    <div>
      <ConnectionBanner
        status={isConnected ? 'connected' : 'disconnected'}
        onReconnect={handleReconnect}
      />
      
      {/* Rest of chat UI */}
    </div>
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConnectionBannerExamples;
