import { render, screen } from '@testing-library/react';
import App from './App';

test('renders chess game', () => {
  render(<App />);
  const heading = screen.getByText(/Chess Game/i);
  expect(heading).toBeInTheDocument();
});
