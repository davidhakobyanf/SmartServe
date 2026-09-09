import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListQueryDto } from './list-query.dto';
import { literalSearch } from './listing.service';

describe('List query validation', () => {
  it('applies bounded defaults and transforms numbers', async () => {
    expect(plainToInstance(ListQueryDto, {})).toMatchObject({ page: 1, pageSize: 24 });
    const query = plainToInstance(ListQueryDto, { page: '2', pageSize: '12', search: '  ՍՈՒՊ  ' });
    expect(await validate(query)).toHaveLength(0);
    expect(query).toMatchObject({ page: 2, pageSize: 12, search: 'ՍՈՒՊ' });
  });
  it.each([{page: 0}, {page: -1}, {page: 'abc'}, {page: 1.5}, {pageSize: 0}, {pageSize: 101}, {pageSize: '1 OR 1=1'}, {categoryId: 'bad'}, {sauceId: 'bad'}, {sort: 'p.title; DROP TABLE products'}, {search: ['a', 'b']}, {search: 'a'.repeat(201)}, {isActive: 'yes'}])('rejects unsafe query %j', async (input) => {
    expect((await validate(plainToInstance(ListQueryDto, input))).length).toBeGreaterThan(0);
  });
  it('escapes LIKE wildcards and folds supported languages', () => {
    expect(literalSearch('100%_\\СУП ԱՊՈՒՐ')).toBe('%100\\%\\_\\\\суп ապուր%');
  });
});
