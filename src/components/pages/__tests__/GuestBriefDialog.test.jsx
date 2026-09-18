import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import GuestBriefDialog from '../GuestBriefDialog';

afterEach(cleanup);

const files = [
    { name: 'Website proposal.pdf', _extractedText: 'Full website requirements, including the final milestone.', _aiBulletPoints: 'Website summary' },
    { name: 'Brand brief.txt', _extractedText: 'Brand identity and packaging requirements.' },
];

function BriefActions() {
    const [file, setFile] = useState(null);
    return (
        <>
            {files.map((entry) => <button key={entry.name} onClick={() => setFile(entry)}>{entry.name}</button>)}
            <GuestBriefDialog file={file} onClose={() => setFile(null)} />
        </>
    );
}

describe('Guest brief viewer', () => {
    it('opens the full text, closes, and opens a different file without stale content', () => {
        render(<BriefActions />);
        expect(screen.queryByRole('dialog')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: files[0].name }));
        expect(screen.getByRole('dialog', { name: 'Full project brief' })).toBeTruthy();
        expect(screen.getByText(files[0]._extractedText)).toBeTruthy();
        expect(screen.queryByText('Website summary')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));
        expect(screen.queryByRole('dialog')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: files[1].name }));
        expect(screen.getByText(files[1]._extractedText)).toBeTruthy();
        expect(screen.queryByText(files[0]._extractedText)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Close brief' }));
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('supports Escape to dismiss the viewer', () => {
        render(<BriefActions />);
        fireEvent.click(screen.getByRole('button', { name: files[0].name }));
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('shows the selected file summary when extracted text is unavailable', () => {
        render(<GuestBriefDialog file={{ name: 'Reference.png', _aiBulletPoints: 'Reference design details' }} onClose={() => {}} />);
        expect(screen.getByText('Requirement summary')).toBeTruthy();
        expect(screen.getByText('Reference design details')).toBeTruthy();
    });
});
