import {type SchemaTypeDefinition} from 'sanity'

import {category} from './documents/category'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {blockContent} from './objects/block-content'
import {courseModule} from './objects/course-module'
import {learningOutcome} from './objects/learning-outcome'
import {lessonResource} from './objects/lesson-resource'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  course,
  lesson,
  instructor,
  category,
  // Objects
  courseModule,
  learningOutcome,
  lessonResource,
  blockContent,
]
