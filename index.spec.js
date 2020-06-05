import { parseFinalDraft, finalDraftToFountain } from "./index";
describe('parseFinalDraft tests', () => {
  test('invalid document', () => {
    expect(() => { parseFinalDraft('HelloWorld') }).toThrow("Could not parse the final draft document.");
  });
  test('empty document', () => {
    expect(() => { parseFinalDraft('') }).toThrow("Could not parse the final draft document.");
  });

  let invalid_final_draft_1 = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?><unknown>Hello world</unknown>';
  test('root is not final draft', () => {
    expect(() => { parseFinalDraft(invalid_final_draft_1) }).toThrow("Not FinalDraft document. Root is not FinalDraft.");
  });

  let invalid_final_draft_2 = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
  <FinalDraft DocumentType="Script" Template="No" Version="4">
  <invalid> </invalid></FinalDraft>
  `;
  test('first child is not content', () => {
    expect(() => { parseFinalDraft(invalid_final_draft_2) }).toThrow("Not FinalDraft document. Content is not a child of FinalDraft.");
  });

  let valid = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
  <FinalDraft DocumentType="Script" Template="No" Version="4"> 
    <Content>
      <Paragraph Type="Scene Heading"> 
      <Text>INT. SOME PLACE - DAY</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>A character moves across.</Text>
      </Paragraph>
      <Paragraph Type="Character">
        <Text>ABE</Text>
      </Paragraph>
      <Paragraph Type="Dialogue">
        <Text>What’s up </Text>
        <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Courier Final Draft" RevisionID="0" Size="12" Style="Bold">Lincoln</Text>
        <Text>?</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>BOB jumps.</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text></Text>
      </Paragraph>
      <Paragraph Type="Character">
        <Text>Chad</Text>
      </Paragraph>
      <Paragraph Type="Parenthetical">
        <Text>(slowly)</Text>
      </Paragraph>
      <Paragraph Type="Dialogue">
        <Text>Not now.</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text></Text>
      </Paragraph>
    </Content>
    </FinalDraft>
  `;

  test('No callbacks passed.', () => {
    expect(() => { parseFinalDraft(valid) }).toThrow("No callbacks passed.");
  });

  const mockdocumentStart = jest.fn(() => { });
  const mockdocumentEnd = jest.fn(() => { });
  const mockparagraphStart = jest.fn((type) => { type });
  const mockparagraphEnd = jest.fn(() => { });
  const mocktext = jest.fn((str, style) => { { str, style } })

  let callbacks = {
    documentStart: mockdocumentStart,
    documentEnd: mockdocumentEnd,
    paragraphStart: mockparagraphStart,
    paragraphEnd: mockparagraphEnd,
    text: mocktext
  };
  parseFinalDraft(valid, callbacks);

  expect(mockdocumentStart.mock.calls.length).toBe(1);
  expect(mockdocumentEnd.mock.calls.length).toBe(1);
  expect(mockparagraphStart.mock.calls.length).toBe(10);
  expect(mockparagraphEnd.mock.calls.length).toBe(10);
  expect(mocktext.mock.calls.length).toBe(12);

  expect(mockparagraphStart.mock.calls[0][0]).toBe("Scene Heading");
  expect(mockparagraphStart.mock.calls[1][0]).toBe("Action");
  expect(mockparagraphStart.mock.calls[2][0]).toBe("Character");
  expect(mockparagraphStart.mock.calls[3][0]).toBe("Dialogue");
  expect(mockparagraphStart.mock.calls[4][0]).toBe("Action");
  expect(mockparagraphStart.mock.calls[5][0]).toBe("Action");
  expect(mockparagraphStart.mock.calls[6][0]).toBe("Character");
  expect(mockparagraphStart.mock.calls[7][0]).toBe("Parenthetical");
  expect(mockparagraphStart.mock.calls[8][0]).toBe("Dialogue");
  expect(mockparagraphStart.mock.calls[9][0]).toBe("Action");

  expect(mocktext.mock.calls[0][0]).toBe("INT. SOME PLACE - DAY");
  expect(mocktext.mock.calls[1][0]).toBe("A character moves across.");
  expect(mocktext.mock.calls[2][0]).toBe("ABE");
  expect(mocktext.mock.calls[3][0]).toBe("What’s up ");
  expect(mocktext.mock.calls[4][0]).toBe("Lincoln");
  expect(mocktext.mock.calls[4][1]).toBe("Bold");
  expect(mocktext.mock.calls[11][0]).toBe("");
});

describe('finalDraftToFountain tests', () => {

  const valid = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
  <FinalDraft DocumentType="Script" Template="No" Version="4"> 
    <Content>
      <Paragraph Type="Scene Heading"> 
        <Text>INT. SOME PLACE - DAY</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>A character moves across.</Text>
      </Paragraph>
      <Paragraph Type="Character">
        <Text>ABE</Text>
      </Paragraph>       
      <Paragraph Type="Dialogue">
        <Text>What’s up</Text>
        <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Courier Final Draft" RevisionID="0" Size="12" Style="Bold">Lincoln</Text>
        <Text>?</Text>      
      </Paragraph>
    <Paragraph Type="Action">
      <Text>BOB jumps.</Text>
    </Paragraph>    
    </Content>
  </FinalDraft>`;

  const result = `
INT. SOME PLACE - DAY

A character moves across.

ABE
What’s up**Lincoln**?

BOB jumps.
`;

  test('sanity', () => {
    return finalDraftToFountain(valid)
      .then(data => {
        console.log(data);
        expect(data).toBe(result);
      })
  });
}
)

describe('finalDraftToFountain tests with parenthetical', () => {

  const valid = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
  <FinalDraft DocumentType="Script" Template="No" Version="4"> 
    <Content>
      <Paragraph Type="Scene Heading"> 
        <Text>INT. SOME PLACE - DAY</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>A character moves across.</Text>
      </Paragraph>
      <Paragraph Type="Character">
        <Text>ABE</Text>
      </Paragraph>
      <Paragraph Type="Parenthetical">
        <Text>(slowly)</Text>
      </Paragraph>
      <Paragraph Type="Dialogue">
        <Text>What’s up</Text>
        <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Courier Final Draft" RevisionID="0" Size="12" Style="Bold">Lincoln</Text>
        <Text>?</Text>      
      </Paragraph>
    <Paragraph Type="Action">
      <Text>BOB jumps.</Text>
    </Paragraph>    
    </Content>
  </FinalDraft>`;

  const result = `
INT. SOME PLACE - DAY

A character moves across.

ABE
(slowly)
What’s up**Lincoln**?

BOB jumps.
`;

  test('sanity', () => {
    return finalDraftToFountain(valid)
      .then(data => {
        console.log(data);
        expect(data).toBe(result);
      })
  });
}
)


describe('finalDraftToFountain tests with blank action lines', () => {

  const valid = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
  <FinalDraft DocumentType="Script" Template="No" Version="4"> 
    <Content>
      <Paragraph Type="Scene Heading"> 
        <Text>INT. SOME PLACE - DAY</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>A character moves across.</Text>
      </Paragraph>
      <Paragraph Type="Character">
        <Text>ABE</Text>
      </Paragraph>
      <Paragraph Type="Parenthetical">
        <Text>(slowly)</Text>
      </Paragraph>
      <Paragraph Type="Dialogue">
        <Text>What’s up</Text>
        <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Courier Final Draft" RevisionID="0" Size="12" Style="Bold">Lincoln</Text>
        <Text>?</Text>      
      </Paragraph>
      <Paragraph Type="Action">
        <Text>BOB jumps.</Text>
        <Text></Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>Scratches himself.</Text>
      </Paragraph>
    </Content>
  </FinalDraft>`;

  const result = `
INT. SOME PLACE - DAY

A character moves across.

ABE
(slowly)
What’s up**Lincoln**?

BOB jumps.

Scratches himself.
`;

  test('sanity', () => {
    return finalDraftToFountain(valid)
      .then(data => {
        console.log(data);
        expect(data).toBe(result);
      })
  });
}
)

describe('finalDraftToFountain tests with unknown paratypes', () => {

  const valid = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
  <FinalDraft DocumentType="Script" Template="No" Version="4"> 
    <Content>
      <Paragraph Type="Scene Heading">
      <SceneProperties Length="3" Page="1" Title="">
      <SceneArcBeats>        
        <CharacterArcBeat Name="HOST">
          <Paragraph Alignment="Left" FirstIndent="0.00" Leading="Regular" LeftIndent="0.00" RightIndent="1.39" SpaceBefore="0" Spacing="1" StartsNewPage="No">
            <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Arial" RevisionID="0" Size="12" Style=""></Text>
          </Paragraph>
        </CharacterArcBeat>
        <CharacterArcBeat Name="PREETHI">
          <Paragraph Alignment="Left" FirstIndent="0.00" Leading="Regular" LeftIndent="0.00" RightIndent="1.39" SpaceBefore="0" Spacing="1" StartsNewPage="No">
            <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Arial" RevisionID="0" Size="12" Style=""></Text>
          </Paragraph>
        </CharacterArcBeat>                     
      </SceneArcBeats>
    </SceneProperties> 
      <Text>INT. SOME PLACE - DAY</Text>
      </Paragraph>
      <Paragraph Type="Action">
        <Text>A character moves across.</Text>
      </Paragraph>
      <Paragraph Type="Character">
        <Text>ABE</Text>
      </Paragraph>
      <Paragraph Type="Parenthetical">
        <Text>(slowly)</Text>
      </Paragraph>
      <Paragraph Type="Dialogue">
        <Text>What’s up</Text>
        <Text AdornmentStyle="0" Background="#FFFFFFFFFFFF" Color="#000000000000" Font="Courier Final Draft" RevisionID="0" Size="12" Style="Bold">Lincoln</Text>
        <Text>?</Text>      
      </Paragraph>
    <Paragraph Type="Action">
      <Text>BOB jumps.</Text>
    </Paragraph>    
    </Content>
  </FinalDraft>`;

  const result = `
INT. SOME PLACE - DAY

A character moves across.

ABE
(slowly)
What’s up**Lincoln**?

BOB jumps.
`;

  test('sanity', () => {
    return finalDraftToFountain(valid)
      .then(data => {
        console.log(data);
        expect(data).toBe(result);
      })
  });
}
)

