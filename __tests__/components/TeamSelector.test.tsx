import { render, screen, fireEvent } from '@testing-library/react-native';
import TeamSelector from '../../components/TeamSelector';

const defaultProps = {
  visible: true,
  selectedTeam: 'SEA' as string | null,
  onSelect: jest.fn(),
  onClose: jest.fn(),
};

describe('TeamSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and all teams option', () => {
    render(<TeamSelector {...defaultProps} />);
    expect(screen.getByText('Select Team')).toBeTruthy();
    expect(screen.getByText('All Teams')).toBeTruthy();
  });

  it('renders NHL team names', () => {
    render(<TeamSelector {...defaultProps} />);
    expect(screen.getByText('Seattle Kraken')).toBeTruthy();
    expect(screen.getByText('Boston Bruins')).toBeTruthy();
    expect(screen.getByText('Vancouver Canucks')).toBeTruthy();
  });

  it('shows a check mark only next to the selected team', () => {
    render(<TeamSelector {...defaultProps} selectedTeam="SEA" />);
    const checks = screen.getAllByText('✓');
    expect(checks.length).toBe(1);
  });

  it('shows a check mark next to All Teams when selectedTeam is null', () => {
    render(<TeamSelector {...defaultProps} selectedTeam={null} />);
    // Only one check mark — on All Teams, not on any team row
    const checks = screen.getAllByText('✓');
    expect(checks.length).toBe(1);
  });

  it('calls onSelect and onClose when a team is tapped', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(<TeamSelector {...defaultProps} onSelect={onSelect} onClose={onClose} />);

    fireEvent.press(screen.getByText('Boston Bruins'));

    expect(onSelect).toHaveBeenCalledWith('BOS');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSelect with null and onClose when All Teams is tapped', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(<TeamSelector {...defaultProps} onSelect={onSelect} onClose={onClose} />);

    fireEvent.press(screen.getByText('All Teams'));

    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is pressed without calling onSelect', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(<TeamSelector {...defaultProps} onSelect={onSelect} onClose={onClose} />);

    fireEvent.press(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('mounts without error when not visible', () => {
    // In the RN test renderer Modal renders its children regardless of visible,
    // so we just verify no crash occurs.
    expect(() => render(<TeamSelector {...defaultProps} visible={false} />)).not.toThrow();
  });
});
