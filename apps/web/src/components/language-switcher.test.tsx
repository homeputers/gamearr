import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { axe } from 'jest-axe';
import i18n from '../lib/i18n';
import { LanguageSwitcher } from './language-switcher';
import { beforeEach, test } from 'vitest';

function NavLabel() {
  const { t } = useTranslation('nav');
  return <span>{t('libraries')}</span>;
}

beforeEach(() => {
  i18n.changeLanguage('en');
});

test('switching language updates labels', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
      <NavLabel />
    </I18nextProvider>,
  );

  expect(screen.getByText('Libraries')).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText(/language/i));
  await userEvent.click(screen.getByText('Spanish'));
  expect(screen.getByText('Bibliotecas')).toBeInTheDocument();
});

test('language switcher has no critical axe violations', async () => {
  const { container } = render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
    </I18nextProvider>,
  );
  const results = await axe(container);
  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical).toHaveLength(0);
});
