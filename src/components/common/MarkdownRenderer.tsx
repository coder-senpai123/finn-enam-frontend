import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownRendererProps {
  content: string;
  colors: {
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    subtleBg: string;
    cardBorder: string;
  };
}

/**
 * Native lightweight Markdown parser & renderer:
 * - Handles ### H3, ## H2, # H1 headers
 * - Handles **bold text** and *italic text*
 * - Handles bullet points (- or • or *)
 * - Handles numbered lists (1. 2. 3.)
 * - Handles divider lines (--- or ***)
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, colors }) => {
  if (!content) return null;

  // Helper to parse inline **bold** text within a line
  const renderInlineFormatted = (text: string, baseStyle: any) => {
    // Regex splits by **bold** or *italic*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <Text key={idx} style={[baseStyle, styles.bold, { color: colors.text }]}>
            {part.slice(2, -2)}
          </Text>
        );
      } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <Text key={idx} style={[baseStyle, styles.italic, { color: colors.textSecondary }]}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      return (
        <Text key={idx} style={baseStyle}>
          {part}
        </Text>
      );
    });
  };

  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        // Empty line spacer
        if (!line) {
          return <View key={index} style={styles.spacer} />;
        }

        // Horizontal Rule
        if (line === '---' || line === '***' || line === '___') {
          return (
            <View
              key={index}
              style={[styles.hr, { backgroundColor: colors.cardBorder }]}
            />
          );
        }

        // H1 Header (# )
        if (line.startsWith('# ')) {
          return (
            <Text key={index} style={[styles.h1, { color: colors.text }]}>
              {line.replace(/^#\s+/, '')}
            </Text>
          );
        }

        // H2 Header (## )
        if (line.startsWith('## ')) {
          return (
            <Text key={index} style={[styles.h2, { color: colors.primary }]}>
              {line.replace(/^##\s+/, '')}
            </Text>
          );
        }

        // H3 Header (### )
        if (line.startsWith('### ')) {
          return (
            <Text key={index} style={[styles.h3, { color: colors.text }]}>
              {line.replace(/^###\s+/, '')}
            </Text>
          );
        }

        // Bullet Point (- or * or •)
        if (/^[-*•]\s+/.test(line)) {
          const bulletText = line.replace(/^[-*•]\s+/, '');
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
              <Text style={styles.bulletTextCol}>
                {renderInlineFormatted(bulletText, [styles.paragraph, { color: colors.textSecondary }])}
              </Text>
            </View>
          );
        }

        // Numbered List (1. 2. 3.)
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const textAfter = numMatch[2];
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={[styles.numBadge, { color: colors.primary }]}>{num}.</Text>
              <Text style={styles.bulletTextCol}>
                {renderInlineFormatted(textAfter, [styles.paragraph, { color: colors.textSecondary }])}
              </Text>
            </View>
          );
        }

        // Standard Paragraph
        return (
          <Text key={index} style={styles.paragraphLine}>
            {renderInlineFormatted(line, [styles.paragraph, { color: colors.textSecondary }])}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  spacer: {
    height: 8,
  },
  hr: {
    height: 1,
    marginVertical: 12,
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  h2: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraphLine: {
    marginBottom: 6,
    lineHeight: 21,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 21,
  },
  bold: {
    fontWeight: '800',
  },
  italic: {
    fontStyle: 'italic',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 21,
    marginRight: 8,
    fontWeight: '900',
  },
  numBadge: {
    fontSize: 12,
    lineHeight: 21,
    fontWeight: '800',
    marginRight: 6,
    minWidth: 18,
  },
  bulletTextCol: {
    flex: 1,
    lineHeight: 21,
  },
});

