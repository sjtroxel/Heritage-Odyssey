import {
  parseGedcomSync,
  createDefaultNodeFactory,
  IndividualNode,
  type GedcomNode,
} from '@it9gamelog/gedcom-parser';

export interface ParsedAncestor {
  gedcomId: string;
  name: string;
  lastName?: string;
  birthDate?: string;
  birthPlace?: string;
  birthYear?: number;
  deathDate?: string;
  deathPlace?: string;
  deathYear?: number;
  arrivalDate?: string;
  arrivalPort?: string;
  departurePort?: string;
  shipName?: string;
  occupations?: string[];
  sourceSummary?: string;
}

export interface GedcomParseResult {
  ancestors: ParsedAncestor[];
  warnings: string[];
}

function childRawValue(node: GedcomNode | undefined, tag: string): string | undefined {
  return node?.children.find((c) => c.tag === tag)?.rawValue;
}

function extractYear(dateStr: string): number | undefined {
  const match = dateStr.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]!, 10) : undefined;
}

function extractLastName(rawNameValue: string): string | undefined {
  const match = rawNameValue.match(/\/([^/]+)\//);
  return match?.[1]?.trim() || undefined;
}

function isLiving(node: GedcomNode, name: string | undefined): boolean {
  const resn = node.children.find((c) => c.tag === 'RESN');
  if (resn?.rawValue && /privacy|confidential/i.test(resn.rawValue)) return true;
  if (!name) return true;
  if (/^living$/i.test(name.trim()) || /^living\s+person$/i.test(name.trim())) return true;
  const hasBirth = node.children.some((c) => c.tag === 'BIRT');
  const hasDeath = node.children.some((c) => c.tag === 'DEAT');
  if (!hasBirth && !hasDeath && /living/i.test(name)) return true;
  return false;
}

export function parseGedcom(raw: string): GedcomParseResult {
  const ancestors: ParsedAncestor[] = [];
  const warnings: string[] = [];

  let parsed;
  try {
    parsed = parseGedcomSync(raw, { nodeFactory: createDefaultNodeFactory() });
  } catch (err) {
    warnings.push(
      `Failed to parse GEDCOM file: ${err instanceof Error ? err.message : String(err)}`,
    );
    return { ancestors, warnings };
  }

  const indiNodes = parsed.nodes.filter((n) => n.tag === 'INDI');

  for (const node of indiNodes) {
    try {
      const indi = node as IndividualNode;
      const gedcomId = node.id ?? '';
      const rawNameNode = node.children.find((c) => c.tag === 'NAME');
      const rawNameValue = rawNameNode?.rawValue ?? '';
      const name = indi.getName() ?? rawNameValue.replace(/\//g, '').trim();

      if (isLiving(node, name)) {
        warnings.push(`Skipped living or private person: ${gedcomId || name}`);
        continue;
      }

      if (!name) {
        warnings.push(`Skipped unnamed individual: ${gedcomId}`);
        continue;
      }

      const lastName = extractLastName(rawNameValue);

      const birthDateNode = indi.getBirthDateNode();
      const birthDate = birthDateNode?.rawValue;
      const birthYear =
        indi.getBirthDate()?.getFullYear() ?? (birthDate ? extractYear(birthDate) : undefined);
      const birtNode = node.children.find((c) => c.tag === 'BIRT');
      const birthPlace = childRawValue(birtNode, 'PLAC');

      const deathDateNode = indi.getDeathDateNode();
      const deathDate = deathDateNode?.rawValue;
      const deathYear =
        indi.getDeathDate()?.getFullYear() ?? (deathDate ? extractYear(deathDate) : undefined);
      const deatNode = node.children.find((c) => c.tag === 'DEAT');
      const deathPlace = childRawValue(deatNode, 'PLAC');

      const immiNode = node.children.find((c) => c.tag === 'IMMI');
      const arrivalDate = childRawValue(immiNode, 'DATE');
      const arrivalPort = childRawValue(immiNode, 'PLAC');
      const shipName = childRawValue(immiNode, 'SHIP');

      const emigNode = node.children.find((c) => c.tag === 'EMIG');
      const departurePort = childRawValue(emigNode, 'PLAC');

      const occupations = node.children
        .filter((c) => c.tag === 'OCCU')
        .map((c) => c.rawValue ?? '')
        .filter(Boolean);

      const sourNodes = node.children.filter((c) => c.tag === 'SOUR');
      const sourceTexts = sourNodes
        .map((s) => childRawValue(s, 'DATA') ?? childRawValue(s, 'TEXT') ?? s.rawValue ?? '')
        .filter(Boolean);
      const sourceSummary = sourceTexts.length > 0 ? JSON.stringify(sourceTexts) : undefined;

      ancestors.push({
        gedcomId,
        name,
        ...(lastName && { lastName }),
        ...(birthDate && { birthDate }),
        ...(birthPlace && { birthPlace }),
        ...(birthYear !== undefined && { birthYear }),
        ...(deathDate && { deathDate }),
        ...(deathPlace && { deathPlace }),
        ...(deathYear !== undefined && { deathYear }),
        ...(arrivalDate && { arrivalDate }),
        ...(arrivalPort && { arrivalPort }),
        ...(shipName && { shipName }),
        ...(departurePort && { departurePort }),
        ...(occupations.length > 0 && { occupations }),
        ...(sourceSummary && { sourceSummary }),
      });
    } catch (err) {
      warnings.push(
        `Skipped individual ${node.id ?? '(unknown)'}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { ancestors, warnings };
}
