## [3.0.0-beta] - 2023-10-22

### Added Feature
- now supports files

### Added
- maintained data type preservation with new hasJs formData element.
- cleanArrayStringUrl - a new function - This is a fix for react-hook-form url empty [] brackets set conversion react-hook-form will not load array values that use the empty [] keys.
- isEmptyObj - a new function - will only be true if passed an empty object
- createPathDataList - a new function - creates a FieldDataObjList array from field data to send to backend, allowing for all valid formData types including blobs.
- arrayPathToValueList - when adding to value list if the value is an array, this will create the path for each array value, then append it to the fieldDataList.

### Notes:
- Data type preservation on FieldValues is possible by passing a hasJs prop on every request. This is removed by the generateFormData function, so you'll not see it in the back end.
- While it may never happen, the past version allowed for empty object or null, This is handled by formData emptyNull value. This allows for there passing.