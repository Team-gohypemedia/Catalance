import os

file_path = r"c:\Users\kshit\Desktop\code\react\Catalance\src\components\pages\Marketplace.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# initialSearchState properties
code = code.replace('selectedSubCategoryId: null,', 'selectedSubCategoryIds: [],')
code = code.replace('selectedToolId: null,', 'selectedToolIds: [],')

# URL params parsing
code = code.replace(
    'selectedSubCategoryId: parsePositiveInteger(params.get("subCategoryId")),',
    'selectedSubCategoryIds: (params.get("subCategoryId") || "").split(",").map(parsePositiveInteger).filter(Boolean),'
)
code = code.replace(
    'selectedToolId: parsePositiveInteger(params.get("toolId")),',
    'selectedToolIds: (params.get("toolId") || "").split(",").map(parsePositiveInteger).filter(Boolean),'
)

# state variables
code = code.replace(
    'const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(',
    'const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState('
)
code = code.replace(
    'initialSearchState.selectedSubCategoryId',
    'initialSearchState.selectedSubCategoryIds'
)
code = code.replace(
    'const [selectedToolId, setSelectedToolId] = useState(initialSearchState.selectedToolId);',
    'const [selectedToolIds, setSelectedToolIds] = useState(initialSearchState.selectedToolIds);'
)

# route sync
code = code.replace('setSelectedSubCategoryId(null);', 'setSelectedSubCategoryIds([]);')
code = code.replace('setSelectedToolId(null);', 'setSelectedToolIds([]);')

# query building (for filters)
code = code.replace(
    'if (selectedSubCategoryId) query.append("subCategoryId", String(selectedSubCategoryId));',
    'if (selectedSubCategoryIds.length > 0) query.append("subCategoryId", selectedSubCategoryIds.join(","));'
)
code = code.replace(
    'if (selectedToolId) query.append("toolId", String(selectedToolId));',
    'if (selectedToolIds.length > 0) query.append("toolId", selectedToolIds.join(","));'
)

# params building (for URL)
code = code.replace(
    'if (selectedSubCategoryId) params.set("subCategoryId", String(selectedSubCategoryId));',
    'if (selectedSubCategoryIds.length > 0) params.set("subCategoryId", selectedSubCategoryIds.join(","));'
)
code = code.replace(
    'if (selectedToolId) params.set("toolId", String(selectedToolId));',
    'if (selectedToolIds.length > 0) params.set("toolId", selectedToolIds.join(","));'
)

# fetchTools dependency
code = code.replace('if (!selectedSubCategoryId) {', 'if (selectedSubCategoryIds.length === 0) {')
code = code.replace(
    'const query = new URLSearchParams({ subCategoryId: String(selectedSubCategoryId) });',
    'const query = new URLSearchParams({ subCategoryId: selectedSubCategoryIds.join(",") });'
)
code = code.replace('}, [selectedSubCategoryId]);', '}, [selectedSubCategoryIds]);')

# chips UI
# Instead of replacing the UI code via regex, I will do it with multi_replace_file_content separately.
# However, I should replace `selectedSubCategoryId` with `selectedSubCategoryIds` in the dependencies array.
# Let's just use string replace for dependencies.
code = code.replace(', selectedSubCategoryId, selectedToolId', ', selectedSubCategoryIds, selectedToolIds')
code = code.replace(', selectedSubCategoryId]', ', selectedSubCategoryIds]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Replacement complete.")
