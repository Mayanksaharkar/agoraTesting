/**
 * TypingIndicator Component Examples
 * Demonstrates usage of the TypingIndicator component
 */

import React, { useState, useEffect } from 'react';
import { TypingIndicator } from './TypingIndicator';

/**
 * Example 1: Basic typing indicator
 */
export function BasicTypingIndicatorExample() {
  const [isTyping, setIsTyping] = useState(false);

  // Simulate typing behavior
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Basic Typing Indicator</h3>
      <TypingIndicator participantName="John Doe" isTyping={isTyping} />
    </div>
  );
}

/**
 * Example 2: Typing indicator with custom styling
 */
export function StyledTypingIndicatorExample() {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Styled Typing Indicator</h3>
      <TypingIndicator
        participantName="Jane Smith"
        isTyping={true}
        className="bg-muted rounded-lg"
      />
    </div>
  );
}

/**
 * Example 3: Hidden typing indicator
 */
export function HiddenTypingIndicatorExample() {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Hidden Typing Indicator</h3>
      <p className="text-sm text-muted-foreground mb-2">
        When isTyping is false, the component returns null
      </p>
      <TypingIndicator participantName="Bob Johnson" isTyping={false} />
      <p className="text-sm text-muted-foreground mt-2">
        (Nothing should be visible above)
      </p>
    </div>
  );
}

/**
 * Example 4: Interactive typing indicator
 */
export function InteractiveTypingIndicatorExample() {
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Interactive Typing Indicator</h3>
      <button
        onClick={() => setIsTyping(!isTyping)}
        className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Toggle Typing ({isTyping ? 'On' : 'Off'})
      </button>
      <TypingIndicator participantName="Alice Williams" isTyping={isTyping} />
    </div>
  );
}

/**
 * All examples combined
 */
export function AllTypingIndicatorExamples() {
  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold mb-6">TypingIndicator Examples</h2>
      <BasicTypingIndicatorExample />
      <StyledTypingIndicatorExample />
      <HiddenTypingIndicatorExample />
      <InteractiveTypingIndicatorExample />
    </div>
  );
}
