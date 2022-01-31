import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
    const title = 'This is the title';
    const date = 'Nov 10, 2021';
    const post = { title, date };

    render(<App post={post} />);
    expect(screen.getByText(/This is the title/i)).toBeInTheDocument();
    expect(screen.getByText(/Nov 10, 2021/i)).toBeInTheDocument();
});
