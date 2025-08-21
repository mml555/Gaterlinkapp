/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    const tree = ReactTestRenderer.create(<App />);
    expect(tree).toBeTruthy();
  });
});

test('renders app title', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  
  // Check if the app title is rendered
  const titleElement = tree!.root.findByProps({ children: 'GaterLink' });
  expect(titleElement).toBeTruthy();
});

test('renders app subtitle', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  
  // Check if the app subtitle is rendered
  const subtitleElement = tree!.root.findByProps({ children: 'Access Control System' });
  expect(subtitleElement).toBeTruthy();
});
